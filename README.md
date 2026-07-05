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

- React/Lovable/TanStack frontend on `http://127.0.0.1:5173`
- TanStack server route `/api/ask`

## Votee Usage

Herald now implements the Beever/Votee hackathon path from the Beever Atlas builder
guide:

1. `/api/ask` receives the worker question.
2. Local safety routing decides `ASK`, `STOP`, `CHECK`, or `OK`.
3. If the question has enough context and Beever env vars are configured, Herald calls
   Beever Atlas MCP `ask_channel(channel_id, question, mode="deep")`.
4. The UI displays Atlas' cited answer with `mode: "beever-atlas"`.
5. If Atlas is not configured or times out, Herald falls back to the local source pack
   so the hackathon demo still works.

Configure live Beever Atlas:

```powershell
$env:BEEVER_MCP_URL="http://localhost:8000/mcp"
$env:BEEVER_MCP_KEY="your-mcp-key"
$env:BEEVER_CHANNEL_NAME="demo-wikipedia" # or set BEEVER_CHANNEL_ID directly
$env:BEEVER_ASK_MODE="deep"
npm run dev
```

Per the builder guide, use `whoami` and `list_channels` to get a real `channel_id`
before relying on a production source pack. Herald does this automatically when
`BEEVER_CHANNEL_ID` is not set.

Relevant files:

- `src/components/live-safety-demo.tsx`: live React demo UI
- `src/lib/beever-atlas-client.ts`: MCP JSON-RPC client for Beever Atlas
- `src/lib/safety-api.ts`: safety router plus Beever Atlas fallback flow
- `votee/site-safety-source-pack.json`: source pack for Beever Atlas
- `.env.example`: Beever Atlas environment variables
