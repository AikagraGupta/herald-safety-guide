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

## Votee + Aicoo Usage

Herald uses Votee as the safety-memory/source-pack layer. A hosted reasoning model
then reads the worker question, photo OCR, and Votee source pack before returning a
cited `ASK`, `STOP`, `CHECK`, or `OK` decision.

1. `/api/ask` receives the worker question.
2. If a camera photo is attached, the frontend sends the image data URL to `/api/ask`.
3. The backend extracts visible text from the image with OCR.space, then includes
   that OCR result in the safety prompt.
4. If `AICOO_API_KEY` is configured, Herald asks Aicoo Agent Chat to reason over
   the Votee source pack. If Aicoo is not configured or fails, Herald falls back to
   Pollinations' free OpenAI-compatible endpoint.
5. The prompt includes the Votee safety source pack as the cited memory layer.
6. The model returns strict JSON: `ASK`, `STOP`, `CHECK`, or `OK`, plus answer,
   next steps, concise rationale, supervisor status, citations, and OCR observations.

Configure the live reasoning model:

```powershell
npm run dev
```

No API key is required for the hackathon demo. Pollinations anonymous access is rate
limited, so optionally add `POLLINATIONS_API_KEY` in Vercel if you register for a
free token and need better limits.

To use Aicoo first, add these Vercel environment variables:

```text
AICOO_API_KEY=your_aicoo_key
AICOO_API_URL=https://www.aicoo.io/api/v1
```

Photo upload still works with Aicoo through OCR text. The public Aicoo docs show a
text Agent Chat API, so raw-image vision remains handled by OCR plus the fallback
vision-capable model path.

Relevant files:

- `src/components/live-safety-demo.tsx`: live React demo UI
- `src/lib/safety-api.ts`: Aicoo/Pollinations reasoning plus Votee source-pack context
- `votee/site-safety-source-pack.json`: source pack for Beever Atlas
- `.env.example`: model and optional Beever Atlas environment variables
