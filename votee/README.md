# Herald x Votee Build Notes

Herald uses Votee's Beever Atlas pattern as the memory layer for physical-worker safety
guidance.

For the hackathon prototype, the app uses this Atlas-ready source pack as the Votee
memory layer and sends the worker question/photo to Pollinations' hosted free LLM for the
actual reasoning, OCR, Cantonese/English handling, and structured safety decision.

```powershell
npm run dev
```

## Intended Atlas Flow

1. Keep `site-safety-source-pack.json` as the Votee safety memory for the prototype.
2. The backend injects the source pack into the LLM prompt as cited context.
3. The LLM reads worker text, Cantonese, English, and attached camera images.
4. The model returns `ASK`, `STOP`, `CHECK`, or `OK` plus citations and rationale.
5. STOP/CHECK decisions notify a supervisor and create an audit log.

This keeps the original Herald idea intact: AI for physical workers, Cantonese-first,
cited, auditable, and never leaving workers without a human path.
