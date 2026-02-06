# 🦜 PARROT GHOST HUB (Netlify-Cli-Dev-Hub)

Parrot Ghost Hub is a powerful local orchestration tool built to clone, containerize, and manage your Netlify site portfolio. It allows you to spin up "Ghost" instances of your production sites in isolated Podman containers with a single click.

## 🚀 Features

- **Automated Site Discovery:** Fetches all sites associated with your Netlify account via the Netlify CLI.
- **One-Click Ghosting:** Clones repositories and launches them in rootless Podman containers.
- **Smart Tech Detection:** - **Node.js:** Automatically runs `npm install` and `npm run dev`.
    - **Static Sites:** Falls back to a Python-based HTTP server.
- **Dynamic Port Management:** Finds available host ports to prevent conflicts when running multiple sites.
- **Real-time Terminal Dashboard:** Monitor container logs directly from the UI.
- **SMTP Testing Suite:** Integrated SMTP configuration for testing email workflows in your local clones.

## 🛠️ Architecture

- **Backend:** FastAPI (Python) - Handles git operations, Podman orchestration, and Netlify CLI integration.
- **Frontend:** React + Vite + Material UI - A sleek, dark-themed "terminal" interface.
- **Containerization:** Podman - Used for secure, rootless container execution.

## 📋 Prerequisites

- [Netlify CLI](https://docs.netlify.com/cli/get-started/) (Logged in via `netlify login`)
- [Podman](https://podman.io/) (Configured for rootless mode)
- Python 3.10+
- Node.js & npm

## 🚦 Getting Started

### 1. Setup Backend

```bash
cd backend
pip install fastapi uvicorn axios
# Ensure netlify-cli is in your PATH
uvicorn main:app --reload
```

2. Setup Frontend

```bash
cd netlify-dashboard
npm install
npm run dev
```

3. Usage

    Open the dashboard at http://localhost:5173.

    Click Sync to fetch your Netlify sites.

    Click Clone Repo on any site with a linked GitHub repository.

    Click Spawn Pod to launch the containerized local environment.

    Access your local "Ghost" site via the provided dynamic port.

🔒 Security Note

This tool uses CORSMiddleware with permissive settings for local development ease. If deploying in a shared environment, restrict allow_origins in main.py.


