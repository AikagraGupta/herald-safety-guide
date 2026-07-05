# Herald x Votee Build Notes

Herald uses Votee's Beever Atlas pattern as the memory layer for physical-worker safety
guidance.

For the hackathon prototype, the app runs with a local Atlas-ready source pack so the demo
does not fail if Docker, API keys, or a live Atlas stack are unavailable during judging.
When Beever Atlas is running, `server.js` can proxy questions to Atlas with:

```powershell
$env:ATLAS_URL="http://localhost:8000"
$env:ATLAS_KEY="dev-key-change-me"
$env:ATLAS_CHANNEL="site-safety"
npm start
```

## Intended Atlas Flow

1. Load `site-safety-source-pack.json` into a Beever Atlas channel named `site-safety`.
2. Sync site SOPs, worker Q&A, incident playbooks, and HK regulatory excerpts.
3. Herald asks Atlas for cited answers through the channel ask endpoint.
4. Herald applies a high-risk safety router before showing the answer.
5. STOP/CHECK decisions notify a supervisor and create an audit log.

This keeps the original Herald idea intact: AI for physical workers, Cantonese-first,
cited, auditable, and never leaving workers without a human path.
