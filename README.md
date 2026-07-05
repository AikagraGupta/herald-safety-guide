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

Herald uses Votee as the safety-memory/source-pack layer and a hosted multimodal LLM
as the reasoning layer. This keeps the demo easy to deploy while still grounding the
answer in Votee-branded safety resources.

1. `/api/ask` receives the worker question.
2. If a camera photo is attached, the frontend sends the image data URL to `/api/ask`.
3. The backend sends text plus image to the OpenAI Responses API for OCR, visual
   inspection, Cantonese/English understanding, and safety reasoning.
4. The prompt includes the Votee safety source pack as the cited memory layer.
5. The model returns strict JSON: `ASK`, `STOP`, `CHECK`, or `OK`, plus answer,
   next steps, concise rationale, supervisor status, citations, and OCR observations.

Configure the live reasoning model:

```powershell
$env:OPENAI_API_KEY="your-openai-api-key"
$env:OPENAI_MODEL="gpt-4o-mini"
npm run dev
```

For Vercel, add `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in Project Settings ->
Environment Variables, then redeploy.

Relevant files:

- `src/components/live-safety-demo.tsx`: live React demo UI
- `src/lib/safety-api.ts`: multimodal LLM reasoning plus Votee source-pack context
- `votee/site-safety-source-pack.json`: source pack for Beever Atlas
- `.env.example`: model and optional Beever Atlas environment variables
