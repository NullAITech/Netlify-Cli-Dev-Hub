import os
import subprocess
import json
import socket
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import unquote

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# --- CONFIG & GLOBAL STATE ---
BASE_CLONE_DIR = os.path.abspath("sentinel_clones")
os.makedirs(BASE_CLONE_DIR, exist_ok=True)
CONFIG_FILE = "sentinel_config.json"
# FIXED: Global dictionary to track active containers
active_containers = {}

def save_config(data):
    with open(CONFIG_FILE, "w") as f:
        json.dump(data, f)

def get_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {"smtp": {}, "site_contacts": {}}

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

@app.get("/api/sites")
def get_sites():
    res = subprocess.run(['netlify', 'sites:list', '--json'], capture_output=True, text=True)
    sites = json.loads(res.stdout)
    processed = []
    for s in sites:
        repo_url = s.get("build_settings", {}).get("repo_url") or ""
        repo_name = repo_url.split("/")[-1].replace(".git", "") if repo_url else ""
        repo_path = os.path.join(BASE_CLONE_DIR, repo_name)
        
        is_cloned = os.path.exists(repo_path)
        
        # Check if podman says this container is running
        container_name = f"ghost_{repo_name.lower().replace('.', '_')}"
        check = subprocess.run(['podman', 'inspect', '-f', '{{.State.Running}}', container_name], capture_output=True, text=True)
        is_running = check.stdout.strip() == "true"

        processed.append({
            "id": s.get("id"),
            "name": s.get("name"),
            "repo": repo_url,
            "is_cloned": is_cloned,
            "repo_path": repo_path,
            "is_running": is_running,
            "port": active_containers.get(repo_name, {}).get("port") if is_running else None
        })
    return processed

@app.post("/api/ghost/start/{repo_name}")
async def start_container(repo_name: str):
    repo_path = os.path.join(BASE_CLONE_DIR, repo_name)
    if not os.path.exists(repo_path):
        raise HTTPException(status_code=404, detail="Repo not cloned.")
    
    port = get_free_port()
    container_name = f"ghost_{repo_name.lower().replace('.', '_')}"
    
    # Clean up old container if it exists
    subprocess.run(['podman', 'rm', '-f', container_name], capture_output=True)

    is_node = os.path.exists(os.path.join(repo_path, "package.json"))
    
    # Rootless Podman command with SELinux label (:Z)
    cmd = [
        'podman', 'run', '-d',
        '--name', container_name,
        '-p', f'{port}:3000',
        '-v', f'{repo_path}:/app:Z',
        '-w', '/app'
    ]

    if is_node:
        cmd += ['node:slim', 'sh', '-c', 'npm install && npm run dev -- --host 0.0.0.0 --port 3000']
    else:
        cmd += ['python:3.9-slim', 'python', '-m', 'http.server', '3000']

    res = subprocess.run(cmd, capture_output=True, text=True)
    
    if res.returncode == 0:
        # Success: Store in the global dict
        active_containers[repo_name] = {"name": container_name, "port": port}
        return {"status": "started", "port": port}
    else:
        raise HTTPException(status_code=500, detail=res.stderr)

@app.get("/api/ghost/logs/{repo_name}")
def get_container_logs(repo_name: str):
    container_name = f"ghost_{repo_name.lower().replace('.', '_')}"
    res = subprocess.run(['podman', 'logs', '--tail', '50', container_name], capture_output=True, text=True)
    return {"logs": res.stdout + res.stderr}

@app.post("/api/ghost/stop/{repo_name}")
def stop_container(repo_name: str):
    container_name = f"ghost_{repo_name.lower().replace('.', '_')}"
    subprocess.run(['podman', 'stop', container_name], capture_output=True)
    if repo_name in active_containers:
        del active_containers[repo_name]
    return {"status": "stopped"}

@app.post("/api/clone")
def clone_repo(repo_url: str):
    repo_name = repo_url.split("/")[-1].replace(".git", "")
    target_path = os.path.join(BASE_CLONE_DIR, repo_name)
    if os.path.exists(target_path):
        return {"status": "exists"}
    res = subprocess.run(['git', 'clone', repo_url, target_path], capture_output=True, text=True)
    return {"status": "success" if res.returncode == 0 else "error"}

@app.post("/api/config/smtp")
def set_smtp(data: dict):
    config = get_config()
    config["smtp"] = data
    save_config(config)
    return {"status": "Config Saved"}

@app.post("/api/sites/{site_id}/contacts")
def set_contacts(site_id: str, contacts: list):
    config = get_config()
    config["site_contacts"][site_id] = contacts
    save_config(config)
    return {"status": "Contacts Updated"}

@app.post("/api/email/send")
def send_ghost_email(to_email: str, subject: str, body: str):
    config = get_config()
    smtp = config.get("smtp")
    
    if not smtp:
        raise HTTPException(status_code=400, detail="SMTP not configured")

    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = smtp['user']
    msg['To'] = to_email

    try:
        # Standard SMTP logic
        with smtplib.SMTP_SSL(smtp['server'], smtp['port']) as server:
            server.login(smtp['user'], smtp['password'])
            server.send_message(msg)
        return {"status": "Email Sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))