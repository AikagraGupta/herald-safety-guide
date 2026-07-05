type LanguageMode = "yue" | "en";
type Risk = "STOP" | "CHECK" | "OK" | "ASK";

type Citation = {
  title: string;
  source: string;
  excerpt: string;
};

type LlmSafetyDecision = {
  risk: Risk;
  answer: string;
  steps: string[];
  reasoning: string[];
  supervisor: {
    status: string;
    message: string;
  };
  citations: Citation[];
  observedText?: string;
};

const sourcePack = [
  {
    id: "fire-protection-controls",
    title: "Votee Site Fire Safety SOP",
    content:
      "Fire detection, warning, and evacuation systems must remain available unless a documented temporary impairment procedure is active. Workers must not disable alarms without supervisor approval, temporary controls, and a compliance log.",
  },
  {
    id: "high-risk-escalation",
    title: "Votee Supervisor Escalation Rule",
    content:
      "Workers must escalate any request to bypass a safety system. The app should log the worker question, decision, citation, responsible supervisor, and final action.",
  },
  {
    id: "electrical-isolation",
    title: "Votee Electrical Isolation SOP",
    content:
      "Electrical work begins only after isolation, lockout/tagout, and testing by a competent person. Treat equipment as live until proven otherwise. Wet conditions near electrical equipment should be treated as high risk until controlled.",
  },
  {
    id: "work-at-height",
    title: "Votee Work-at-Height Checklist",
    content:
      "Work at height requires suitable access, fall prevention controls, stable footing, inspected equipment, and supervisor review when conditions change.",
  },
  {
    id: "confined-space",
    title: "Votee Confined Space Entry SOP",
    content:
      "Confined space entry needs a permit, atmospheric testing, ventilation, standby support, and rescue arrangements before anyone enters.",
  },
  {
    id: "hot-work-permit",
    title: "Votee Hot Work Permit SOP",
    content:
      "Hot work requires permit approval, combustible control, extinguishing equipment, and a fire watch before work starts.",
  },
  {
    id: "frontline-uncertainty",
    title: "Votee Frontline Uncertainty Rule",
    content:
      "If a worker's question lacks the location, intended action, or visible hazard, the system should ask for more context instead of inventing a safety answer.",
  },
];

function hasCjk(text: string) {
  return /[\u3400-\u9fff]/.test(text);
}

function getPollinationsConfig() {
  return {
    apiKey: process.env.POLLINATIONS_API_KEY,
    model: process.env.POLLINATIONS_MODEL ?? "openai",
  };
}

function buildPrompt(question: string, language: LanguageMode, hasImage: boolean) {
  const outputLanguage = language === "yue" ? "Cantonese, Hong Kong style" : "English";

  return [
    "You are Herald, an AI safety copilot for physical workers: firefighters, EMTs, utility crews, warehouse teams, maintenance workers, construction crews, facilities staff, and field operators.",
    "Use the worker's natural-language question, any attached image, and the Votee safety source pack below. The Votee pack is the cited safety memory. The hosted LLM is the reasoning engine.",
    "If an image is attached, inspect it for hazards and OCR any visible labels, signs, panels, gauges, permits, tags, warnings, or written instructions. Put only relevant OCR/visual observations in observedText.",
    "Do not use canned examples. Make a fresh decision for this exact situation.",
    "If the question or image lacks enough context, choose ASK and ask for the missing details instead of guessing.",
    "Risk rules:",
    "- STOP: immediate serious harm, unsafe bypass, emergency, confined space, fire/smoke, live electrical, wet electrical condition, fall hazard, unstable heavy load, chemical/gas exposure, or unknown high-risk condition.",
    "- CHECK: potentially manageable only after verification, permit, PPE, supervisor review, area control, or source-pack confirmation.",
    "- OK: ordinary low-risk task where normal controls clearly match the site.",
    "- ASK: insufficient location/task/hazard detail.",
    `Return worker-facing content in ${outputLanguage}. Keep it short enough for a phone screen.`,
    "Return ONLY raw JSON, no markdown, with this exact shape:",
    JSON.stringify(
      {
        risk: "STOP | CHECK | OK | ASK",
        answer: "one direct worker-facing answer",
        steps: ["concrete next action 1", "concrete next action 2", "concrete next action 3"],
        reasoning: [
          "short rationale item about what was understood",
          "short rationale item about missing/sufficient context",
          "short rationale item about why the risk classification was chosen",
        ],
        supervisor: {
          status: "Required | Recommended | Optional | Not sent",
          message: "short supervisor/escalation message",
        },
        citations: [
          {
            title: "Votee source title",
            source: "Votee source id",
            excerpt: "short supporting excerpt from the Votee source pack",
          },
        ],
        observedText: "relevant OCR or visual observations from the image, or empty string",
      },
      null,
      2,
    ),
    hasImage ? "Image status: attached." : "Image status: none.",
    "Votee safety source pack:",
    JSON.stringify(sourcePack, null, 2),
    `Worker question: ${question}`,
  ].join("\n\n");
}

function normalizeDecision(value: unknown): LlmSafetyDecision | null {
  const parsed = value as Partial<LlmSafetyDecision> | null;
  if (!parsed || typeof parsed !== "object") return null;
  if (!["STOP", "CHECK", "OK", "ASK"].includes(String(parsed.risk))) return null;
  if (!parsed.answer?.trim()) return null;

  return {
    risk: parsed.risk as Risk,
    answer: String(parsed.answer).trim(),
    steps: Array.isArray(parsed.steps) ? parsed.steps.map(String).filter(Boolean).slice(0, 5) : [],
    reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning.map(String).filter(Boolean).slice(0, 4) : [],
    supervisor: {
      status: parsed.supervisor?.status ?? (parsed.risk === "STOP" ? "Required" : parsed.risk === "CHECK" ? "Recommended" : "Optional"),
      message: parsed.supervisor?.message ?? "Supervisor review depends on the model decision.",
    },
    citations: Array.isArray(parsed.citations)
      ? parsed.citations
          .map((citation) => ({
            title: String(citation.title ?? "Votee safety source pack"),
            source: String(citation.source ?? "Votee"),
            excerpt: String(citation.excerpt ?? ""),
          }))
          .filter((citation) => citation.title && citation.excerpt)
          .slice(0, 4)
      : [],
    observedText: String(parsed.observedText ?? ""),
  };
}

function parseOutputText(payload: Record<string, unknown>) {
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  for (const choice of choices) {
    const message = (choice as Record<string, unknown>).message as Record<string, unknown> | undefined;
    const content = message?.content;
    if (typeof content === "string" && content.trim()) return content.trim();
  }

  if (typeof payload.output_text === "string") return payload.output_text;

  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  for (const candidate of candidates) {
    const content = (candidate as Record<string, unknown>).content as Record<string, unknown> | undefined;
    const parts = Array.isArray(content?.parts) ? content.parts : [];
    const text = parts
      .map((part) => ((part as Record<string, unknown>).text ? String((part as Record<string, unknown>).text) : ""))
      .join("")
      .trim();
    if (text) return text;
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray((item as Record<string, unknown>).content) ? ((item as Record<string, unknown>).content as unknown[]) : [];
    for (const part of content) {
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string") return text;
    }
  }

  return "";
}

function parseImageDataUrl(imageDataUrl: string) {
  const match = imageDataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) throw new Error("Attached photo format was not readable. Try attaching a JPEG, PNG, or WEBP image.");

  return {
    mimeType: match[1],
    data: match[2],
  };
}

async function askReasoningModel(question: string, language: LanguageMode, imageDataUrl?: string) {
  const config = getPollinationsConfig();

  const content: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: buildPrompt(question, language, Boolean(imageDataUrl)),
    },
  ];

  if (imageDataUrl) {
    parseImageDataUrl(imageDataUrl);
    content.push({
      type: "image_url",
      image_url: {
        url: imageDataUrl,
      },
    });
  }

  const response = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content:
            "You are Herald. Return only valid JSON for a physical-worker safety decision. Never include markdown fences.",
        },
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.2,
      max_tokens: 900,
      stream: false,
    }),
  });

  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const error = (payload.error ?? {}) as Record<string, unknown>;
    throw new Error(String(error.message ?? `Pollinations reasoning failed with HTTP ${response.status}`));
  }

  const outputText = parseOutputText(payload);
  if (!outputText) throw new Error("The reasoning model returned no structured text.");

  const decision = normalizeDecision(JSON.parse(outputText));
  if (!decision) throw new Error("The reasoning model returned an invalid safety decision.");

  if (!decision.steps.length) {
    decision.steps = ["Pause and confirm the site condition.", "Escalate to a competent supervisor if risk is unclear."];
  }

  if (!decision.reasoning.length) {
    decision.reasoning = ["Pollinations reasoned from the worker question, attached image if present, and Votee safety source context."];
  }

  if (!decision.citations.length) {
    decision.citations = [
      {
        title: "Votee safety source pack",
        source: "frontline-uncertainty",
        excerpt: "If context is missing, ask for more details instead of inventing a safety answer.",
      },
    ];
  }

  return decision;
}

export async function handleSafetyAsk(request: Request) {
  if (request.method !== "POST") {
    return Response.json({ error: "Use POST for safety questions." }, { status: 405 });
  }

  let body: { question?: string; language?: LanguageMode; imageDataUrl?: string };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question && !body.imageDataUrl) {
    return Response.json({ error: "Ask a question or attach a site photo first." }, { status: 400 });
  }

  const startedAt = Date.now();
  const language: LanguageMode = body.language === "en" && !hasCjk(question ?? "") ? "en" : "yue";

  try {
    const decision = await askReasoningModel(question || "Please inspect this site photo and advise what the worker should do.", language, body.imageDataUrl);

    return Response.json(
      {
        mode: "pollinations-votee-source-pack",
        risk: decision.risk,
        answer: decision.answer,
        language,
        steps: decision.steps,
        citations: decision.citations,
        reasoning: decision.reasoning,
        observedText: decision.observedText,
        supervisor: decision.supervisor,
        logs: [
          {
            id: `LOG-${startedAt}`,
            time: new Date(startedAt).toISOString(),
            question: question || "[site photo only]",
            risk: decision.risk,
            ruleId: "llm-reasoned-votee-source-pack",
          },
        ],
        latencyMs: Math.max(45, Date.now() - startedAt),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("LLM reasoning failed.", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Free LLM reasoning failed. Try again in a few seconds.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
