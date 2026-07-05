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

const safetyDecisionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["risk", "answer", "steps", "reasoning", "supervisor", "citations", "observedText"],
  properties: {
    risk: { type: "string", enum: ["STOP", "CHECK", "OK", "ASK"] },
    answer: { type: "string" },
    steps: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: { type: "string" },
    },
    reasoning: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string" },
    },
    supervisor: {
      type: "object",
      additionalProperties: false,
      required: ["status", "message"],
      properties: {
        status: { type: "string", enum: ["Required", "Recommended", "Optional", "Not sent"] },
        message: { type: "string" },
      },
    },
    citations: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "source", "excerpt"],
        properties: {
          title: { type: "string" },
          source: { type: "string" },
          excerpt: { type: "string" },
        },
      },
    },
    observedText: { type: "string" },
  },
};

function hasCjk(text: string) {
  return /[\u3400-\u9fff]/.test(text);
}

function getOpenAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  return {
    apiKey,
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  };
}

function buildPrompt(question: string, language: LanguageMode, hasImage: boolean) {
  const outputLanguage = language === "yue" ? "Cantonese, Hong Kong style" : "English";

  return [
    "You are Herald, an AI safety copilot for physical workers: firefighters, EMTs, utility crews, warehouse teams, maintenance workers, construction crews, facilities staff, and field operators.",
    "Use the worker's natural-language question, any attached image, and the Votee safety source pack below. The Votee pack is the cited safety memory. The LLM is the reasoning engine.",
    "If an image is attached, inspect it for hazards and OCR any visible labels, signs, panels, gauges, permits, tags, warnings, or written instructions. Put only relevant OCR/visual observations in observedText.",
    "Do not use canned examples. Make a fresh decision for this exact situation.",
    "If the question or image lacks enough context, choose ASK and ask for the missing details instead of guessing.",
    "Risk rules:",
    "- STOP: immediate serious harm, unsafe bypass, emergency, confined space, fire/smoke, live electrical, wet electrical condition, fall hazard, unstable heavy load, chemical/gas exposure, or unknown high-risk condition.",
    "- CHECK: potentially manageable only after verification, permit, PPE, supervisor review, area control, or source-pack confirmation.",
    "- OK: ordinary low-risk task where normal controls clearly match the site.",
    "- ASK: insufficient location/task/hazard detail.",
    `Return worker-facing content in ${outputLanguage}. Keep it short enough for a phone screen.`,
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
  if (typeof payload.output_text === "string") return payload.output_text;

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

async function askReasoningModel(question: string, language: LanguageMode, imageDataUrl?: string) {
  const config = getOpenAiConfig();
  if (!config) {
    throw new Error("OPENAI_API_KEY is missing. Add it in Vercel Environment Variables to enable LLM reasoning, OCR, Cantonese, and image understanding.");
  }

  const content: Array<Record<string, unknown>> = [
    {
      type: "input_text",
      text: buildPrompt(question, language, Boolean(imageDataUrl)),
    },
  ];

  if (imageDataUrl) {
    content.push({
      type: "input_image",
      image_url: imageDataUrl,
      detail: "low",
    });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      input: [
        {
          role: "user",
          content,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "herald_safety_decision",
          strict: true,
          schema: safetyDecisionSchema,
        },
      },
      max_output_tokens: 900,
      store: false,
    }),
  });

  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const error = (payload.error ?? {}) as Record<string, unknown>;
    throw new Error(String(error.message ?? `OpenAI reasoning failed with HTTP ${response.status}`));
  }

  const outputText = parseOutputText(payload);
  if (!outputText) throw new Error("The reasoning model returned no structured text.");

  const decision = normalizeDecision(JSON.parse(outputText));
  if (!decision) throw new Error("The reasoning model returned an invalid safety decision.");

  if (!decision.steps.length) {
    decision.steps = ["Pause and confirm the site condition.", "Escalate to a competent supervisor if risk is unclear."];
  }

  if (!decision.reasoning.length) {
    decision.reasoning = ["The LLM reasoned from the worker question, attached image if present, and Votee safety source context."];
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
        mode: "openai-votee-source-pack",
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
        error: error instanceof Error ? error.message : "LLM reasoning failed. Check OPENAI_API_KEY and try again.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
