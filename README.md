# Herald Safety Guide

Herald is **AI for Physical Workers**: a clean hackathon demo for safety-critical site
questions, cited Votee/Beever Atlas source memory, supervisor escalation, and compliance
logging.

## Run the Demo

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173.

`npm run dev` starts:

- React/Lovable frontend on `http://127.0.0.1:5173`
- Herald API server on `http://127.0.0.1:4173`
- Vite proxy from `/api/*` to the API server

## Judge Flow

1. Open the homepage.
2. The live demo auto-runs the fire-alarm scenario.
3. Show:
   - `STOP`
   - Votee Atlas source-pack citations
   - Supervisor notification
   - Compliance log
4. Try another scenario such as live wire, scaffold, or hot work.

## Votee Usage

The current demo uses an Atlas-ready local source pack for reliability during judging.
It can be swapped to live Beever Atlas by setting these environment variables before
starting the API:

```powershell
$env:ATLAS_URL="http://localhost:8000"
$env:ATLAS_KEY="dev-key-change-me"
$env:ATLAS_CHANNEL="site-safety"
npm run dev
```

Relevant files:

- `src/components/live-safety-demo.tsx`: live React demo UI
- `api-server.cjs`: safety API and Atlas proxy path
- `votee/site-safety-source-pack.json`: source pack for Beever Atlas
- `vite.config.ts`: `/api` proxy
