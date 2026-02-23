# Netlify Ghost Hub (Parrot OS)

Local Netlify CLI control plane for Parrot OS users. This app syncs your Netlify sites, clones repos, and launches local preview pods with Podman. The UI shows live previews, repo links, URLs, and review workflows.

## Requirements
- Node.js + npm
- Python 3.9+
- Podman (rootless)
- Netlify CLI

## Podman Service
This app auto-checks Podman before starting a pod. If Podman is not running, start the rootless service:

```bash
systemctl --user start podman.socket
```

Optional: enable it on login:

```bash
systemctl --user enable podman.socket
```

## Resource Limits
Every pod started by the app is capped at **4GB RAM**:
- `--memory 4g`
- `--memory-swap 4g`

## Run Backend
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Run Frontend
```bash
cd netlify-dashboard
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## API Endpoints
- `GET /api/sites`: Netlify sites with repo + URL metadata + contacts
- `POST /api/clone?repo_url=...`: Clone repository
- `POST /api/ghost/start/{repo_name}`: Start pod (auto-starts Podman service)
- `POST /api/ghost/stop/{repo_name}`: Stop pod
- `POST /api/ghost/stop-all`: Stop all app-managed pods
- `GET /api/ghost/logs/{repo_name}`: Tail logs
- `GET /api/ghost/stats`: CPU/RAM usage for app-managed pods
- `POST /api/config/smtp`: Save SMTP credentials
- `POST /api/sites/{site_id}/contacts`: Update reviewer contacts
- `POST /api/email/send`: Send preview email

## Monitoring Pod Usage
To show CPU/RAM usage in the UI, call:

```http
GET /api/ghost/stats
```

Example response (per container):
```json
{
  "containers": [
    {
      "name": "ghost_my-site",
      "cpu": "0.05%",
      "mem": "32.5MiB / 4.0GiB",
      "mem_percent": "0.79%"
    }
  ],
  "count": 1
}
```
