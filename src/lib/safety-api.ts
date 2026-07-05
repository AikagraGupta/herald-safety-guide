type LanguageMode = "yue" | "en";
type Risk = "STOP" | "CHECK" | "OK" | "ASK";

type Citation = {
  title: string;
  source: string;
  excerpt: string;
};

type ConversationTurn = {
  role: "worker" | "herald";
  content: string;
  risk?: Risk;
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
  fallback?: boolean;
  provider?: "aicoo" | "pollinations";
};

type LooseDecision = Partial<LlmSafetyDecision> & {
  step1?: string;
  step2?: string;
  step3?: string;
  step4?: string;
  reason1?: string;
  reason2?: string;
  reason3?: string;
  reason4?: string;
  supervisorStatus?: string;
  supervisorMessage?: string;
  citationTitle?: string;
  citationSource?: string;
  citationExcerpt?: string;
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
    visionModel: process.env.POLLINATIONS_VISION_MODEL ?? "openai",
  };
}

function getAicooConfig() {
  const apiKey = process.env.AICOO_API_KEY ?? process.env.PULSE_API_KEY;
  if (!apiKey) return null;

  const rawBaseUrl = (process.env.AICOO_API_URL ?? "https://www.aicoo.io/api/v1").trim();
  const baseUrl = /^ttps?:\/\//i.test(rawBaseUrl)
    ? `h${rawBaseUrl}`
    : /^https?:\/\//i.test(rawBaseUrl)
      ? rawBaseUrl
      : `https://${rawBaseUrl}`;

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ""),
    model: process.env.AICOO_MODEL,
  };
}

function normalizeHistory(value: unknown): ConversationTurn[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-8)
    .map((turn) => {
      const item = turn as Record<string, unknown>;
      const role = item.role === "herald" ? "herald" : item.role === "worker" ? "worker" : null;
      const content = typeof item.content === "string" ? item.content.trim() : "";
      const risk = item.risk && ["STOP", "CHECK", "OK", "ASK"].includes(String(item.risk)) ? (String(item.risk) as Risk) : undefined;
      if (!role || !content) return null;
      return { role, content: content.slice(0, 700), risk };
    })
    .filter((turn): turn is ConversationTurn => Boolean(turn));
}

function formatHistory(history: ConversationTurn[]) {
  if (!history.length) return "Conversation so far: none.";

  return [
    "Conversation so far:",
    ...history.map((turn, index) => {
      const speaker = turn.role === "worker" ? "Worker" : "Herald";
      const risk = turn.risk ? ` (${turn.risk})` : "";
      return `${index + 1}. ${speaker}${risk}: ${turn.content}`;
    }),
  ].join("\n");
}

function buildPrompt(question: string, language: LanguageMode, hasImage: boolean, imageOcrText = "", history: ConversationTurn[] = []) {
  const outputLanguage = language === "yue" ? "Cantonese, Hong Kong style" : "English";

  return [
    "You are Herald, an AI safety copilot for physical workers: firefighters, EMTs, utility crews, warehouse teams, maintenance workers, construction crews, facilities staff, and field operators.",
    "Use the worker's natural-language question, any attached image, and the Votee safety source pack below. The Votee pack is the cited safety memory. The hosted LLM is the reasoning engine.",
    "Use the conversation so far as short-term memory. If the latest worker message is a follow-up, combine it with the previous question and Herald answer before deciding.",
    "When Herald previously asked for more context and the worker now provides it, make the final safety call if enough context is available. If context is still missing, ask only for the missing details.",
    "If an image is attached, inspect it for hazards and OCR any visible labels, signs, panels, gauges, permits, tags, warnings, or written instructions. Put only relevant OCR/visual observations in observedText.",
    "Do not use canned examples. Make a fresh decision for this exact situation.",
    "If the question or image lacks enough context, choose ASK and ask for the missing details instead of guessing.",
    "Risk rules:",
    "- STOP: immediate serious harm, unsafe bypass, emergency, confined space, fire/smoke, live electrical, wet electrical condition, fall hazard, unstable heavy load, chemical/gas exposure, or unknown high-risk condition.",
    "- CHECK: potentially manageable only after verification, permit, PPE, supervisor review, area control, or source-pack confirmation.",
    "- OK: ordinary low-risk task where normal controls clearly match the site.",
    "- ASK: insufficient location/task/hazard detail.",
    `Return worker-facing content in ${outputLanguage}. Keep it short enough for a phone screen.`,
    "Return ONLY raw JSON, no markdown. Use plain strings only, no arrays. Use this exact shape:",
    JSON.stringify(
      {
        risk: "STOP | CHECK | OK | ASK",
        answer: "one direct worker-facing answer",
        step1: "concrete next action 1",
        step2: "concrete next action 2",
        step3: "concrete next action 3",
        reason1: "short rationale item about what was understood",
        reason2: "short rationale item about missing/sufficient context",
        reason3: "short rationale item about why the risk classification was chosen",
        supervisorStatus: "Required | Recommended | Optional | Not sent",
        supervisorMessage: "short supervisor/escalation message",
        citationTitle: "Votee source title",
        citationSource: "Votee source id",
        citationExcerpt: "short supporting excerpt from the Votee source pack",
        observedText: "relevant OCR or visual observations from the image, or empty string",
      },
      null,
      2,
    ),
    hasImage ? "Image status: attached." : "Image status: none.",
    imageOcrText ? `OCR text extracted from the attached image: ${imageOcrText}` : "OCR text extracted from the attached image: none.",
    formatHistory(history),
    "Votee safety source pack:",
    JSON.stringify(sourcePack, null, 2),
    `Latest worker message: ${question}`,
  ].join("\n\n");
}

function toStringList(...values: unknown[]) {
  return values.flatMap((value) => {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string") return value.split(/\n+|(?:^|\s)\d+\.\s+/);
    return [];
  }).map((item) => item.trim()).filter(Boolean).slice(0, 5);
}

function normalizeDecision(value: unknown): LlmSafetyDecision | null {
  const parsed = value as LooseDecision | null;
  if (!parsed || typeof parsed !== "object") return null;
  if (!["STOP", "CHECK", "OK", "ASK"].includes(String(parsed.risk))) return null;
  if (!parsed.answer?.trim()) return null;

  const supervisor = parsed.supervisor ?? {
    status: parsed.supervisorStatus,
    message: parsed.supervisorMessage,
  };
  const citation =
    parsed.citationTitle || parsed.citationExcerpt
      ? [
          {
            title: String(parsed.citationTitle ?? "Votee safety source pack"),
            source: String(parsed.citationSource ?? "Votee"),
            excerpt: String(parsed.citationExcerpt ?? ""),
          },
        ]
      : [];

  return {
    risk: parsed.risk as Risk,
    answer: String(parsed.answer).trim(),
    steps: toStringList(parsed.steps, parsed.step1, parsed.step2, parsed.step3, parsed.step4),
    reasoning: toStringList(parsed.reasoning, parsed.reason1, parsed.reason2, parsed.reason3, parsed.reason4).slice(0, 4),
    supervisor: {
      status: supervisor?.status ?? (parsed.risk === "STOP" ? "Required" : parsed.risk === "CHECK" ? "Recommended" : "Optional"),
      message: supervisor?.message ?? "Supervisor review depends on the model decision.",
    },
    citations: [
      ...citation,
      ...(Array.isArray(parsed.citations)
        ? parsed.citations
          .map((citation) => ({
            title: String(citation.title ?? "Votee safety source pack"),
            source: String(citation.source ?? "Votee"),
            excerpt: String(citation.excerpt ?? ""),
          }))
          .filter((citation) => citation.title && citation.excerpt)
        : []),
    ].slice(0, 4),
    observedText: String(parsed.observedText ?? ""),
  };
}

function extractJsonObject(text: string) {
  const clean = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end <= start) return clean;
  return clean.slice(start, end + 1);
}

function tryParseJson(text: string) {
  const candidates = [
    extractJsonObject(text),
    extractJsonObject(text).replace(/,\s*([}\]])/g, "$1"),
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      // Try the next increasingly tolerant candidate.
    }
  }

  return null;
}

function readStringField(text: string, field: string) {
  const pattern = new RegExp(`["']?${field}["']?\\s*:\\s*(["'])([\\s\\S]*?)\\1(?=\\s*[,}\\n])`, "i");
  const match = text.match(pattern);
  return match?.[2]?.replace(/\\"/g, '"').trim();
}

function readRisk(text: string): Risk | null {
  const field = readStringField(text, "risk")?.toUpperCase();
  if (field === "STOP" || field === "CHECK" || field === "OK" || field === "ASK") return field;
  const match = text.match(/\b(STOP|CHECK|OK|ASK)\b/i)?.[1]?.toUpperCase();
  if (match === "STOP" || match === "CHECK" || match === "OK" || match === "ASK") return match;
  return null;
}

function parseLooseDecision(text: string) {
  const parsed = tryParseJson(text);
  const normalized = normalizeDecision(parsed);
  if (normalized) return normalized;

  const loose: LooseDecision = {
    risk: readRisk(text) ?? undefined,
    answer: readStringField(text, "answer"),
    step1: readStringField(text, "step1"),
    step2: readStringField(text, "step2"),
    step3: readStringField(text, "step3"),
    reason1: readStringField(text, "reason1"),
    reason2: readStringField(text, "reason2"),
    reason3: readStringField(text, "reason3"),
    supervisorStatus: readStringField(text, "supervisorStatus"),
    supervisorMessage: readStringField(text, "supervisorMessage"),
    citationTitle: readStringField(text, "citationTitle"),
    citationSource: readStringField(text, "citationSource"),
    citationExcerpt: readStringField(text, "citationExcerpt"),
    observedText: readStringField(text, "observedText"),
  };

  return normalizeDecision(loose);
}

function hasHighRiskSignal(text: string) {
  return /\b(live|electric|electrical|panel|breaker|wire|water|wet|fire|smoke|gas|confined|height|roof|scaffold|ladder|weld|chemical|alarm|spill)\b/i.test(
    text,
  );
}

function safeFallbackDecision(question: string, language: LanguageMode, reason: string): LlmSafetyDecision {
  const highRisk = hasHighRiskSignal(question);
  const electricalWet =
    /(live|electric|electrical|panel|breaker|wire)/i.test(question) && /(wet|water|floor|spill)/i.test(question);
  const isYue = language === "yue";

  return {
    risk: highRisk ? "STOP" : "ASK",
    answer: isYue
      ? highRisk
        ? "先停低，唔好繼續做。現場可能有高風險情況，等主管或合資格人員確認之後先再開工。"
        : "我需要多少少現場資料先可以安全判斷。講清楚位置、你準備做咩、同見到咩危險。"
      : highRisk
        ? electricalWet
          ? "Stop. The situation indicates a live electrical panel with wet floor conditions. Do not open the panel until it is isolated, dried, and verified safe by a competent person."
          : "Stop for now. Do not continue until a supervisor or competent person confirms the condition is safe."
        : "I need a little more site context before making a safety call. Tell me the location, task, and visible hazard.",
    steps: isYue
      ? ["停低並保持安全距離。", "補充位置、工作動作、可見危險或加相片。", "如涉及電、火、煙、氣體、高空或密閉空間，立即通知主管。"]
      : electricalWet
        ? ["Keep people away from the wet area and the panel.", "Ask a supervisor or qualified electrical worker to isolate, lock out, tag, and test the panel.", "Dry and control the area before any panel access resumes."]
        : ["Pause and keep a safe distance.", "Add the location, intended action, visible hazard, or a photo.", "If electricity, fire, smoke, gas, height, or confined space is involved, notify a supervisor."],
    reasoning: [
      "The hosted model response could not be safely structured, so Herald used a conservative safety fallback.",
      electricalWet
        ? "OCR or worker text indicates wet-floor and live-electrical-panel risk."
        : highRisk
          ? "High-risk words were present in the worker question or photo text."
          : "The worker question needs more site detail before a safe decision.",
      reason,
    ],
    supervisor: {
      status: highRisk ? "Required" : "Not sent",
      message: highRisk
        ? "Supervisor review is required because the live response was not reliable enough and high-risk conditions may be present."
        : "No supervisor alert sent yet; add more context first.",
    },
    citations: [
      {
        title: electricalWet ? "Votee Electrical Isolation SOP" : "Votee Frontline Uncertainty Rule",
        source: electricalWet ? "electrical-isolation" : "frontline-uncertainty",
        excerpt: electricalWet
          ? "Electrical work begins only after isolation, lockout/tagout, and testing by a competent person. Wet conditions near electrical equipment should be treated as high risk until controlled."
          : "If context is missing, ask for more details instead of inventing a safety answer.",
      },
    ],
    observedText: "",
    fallback: true,
  };
}

function safeFallbackWithOcr(question: string, language: LanguageMode, reason: string, imageOcrText = "") {
  const decision = safeFallbackDecision(`${question}\n${imageOcrText}`, language, reason);
  if (imageOcrText) {
    decision.observedText = imageOcrText;
  }
  return decision;
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

function parseAicooOutputText(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    const payload = JSON.parse(trimmed) as Record<string, unknown>;
    const direct = parseOutputText(payload);
    if (direct) return direct;

    for (const field of ["text", "answer", "response", "content"]) {
      const value = payload[field];
      if (typeof value === "string" && value.trim()) return value.trim();
    }

    const message = payload.message as Record<string, unknown> | string | undefined;
    if (typeof message === "string") return message.trim();
    if (typeof message?.content === "string") return message.content.trim();
  } catch {
    // Aicoo can stream newline-delimited events. Parse those below.
  }

  const chunks: string[] = [];
  for (const line of trimmed.split(/\r?\n/)) {
    let item = line.trim();
    if (!item) continue;
    if (item.startsWith("data:")) item = item.slice(5).trim();
    if (item === "[DONE]") continue;

    try {
      const event = JSON.parse(item) as Record<string, unknown>;
      for (const field of ["textDelta", "delta", "text", "content", "answer", "response"]) {
        const value = event[field];
        if (typeof value === "string") chunks.push(value);
      }

      const message = event.message as Record<string, unknown> | string | undefined;
      if (typeof message === "string") chunks.push(message);
      if (typeof message?.content === "string") chunks.push(message.content);
    } catch {
      // Ignore non-JSON lines such as SSE event labels.
    }
  }

  return chunks.join("").trim();
}

function parseImageDataUrl(imageDataUrl: string) {
  const match = imageDataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) throw new Error("Attached photo format was not readable. Try attaching a JPEG, PNG, or WEBP image.");

  return {
    mimeType: match[1],
    data: match[2],
  };
}

async function extractPhotoText(imageDataUrl: string, language: LanguageMode) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const form = new URLSearchParams();
    form.set("base64Image", imageDataUrl);
    form.set("language", language === "yue" ? "cht" : "eng");
    form.set("isOverlayRequired", "false");
    form.set("scale", "true");
    form.set("OCREngine", "2");

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: process.env.OCR_SPACE_API_KEY ?? "helloworld",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
      signal: controller.signal,
    });

    const payload = (await response.json()) as {
      ParsedResults?: Array<{ ParsedText?: string }>;
      IsErroredOnProcessing?: boolean;
    };

    if (!response.ok || payload.IsErroredOnProcessing) return "";

    return (
      payload.ParsedResults?.map((result) => result.ParsedText?.trim())
        .filter(Boolean)
        .join("\n")
        .replace(/\s+\n/g, "\n")
        .trim()
        .slice(0, 1200) ?? ""
    );
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

async function askAicooReasoningModel(
  question: string,
  language: LanguageMode,
  hasImage: boolean,
  imageOcrText: string,
  history: ConversationTurn[],
) {
  const config = getAicooConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.AICOO_TIMEOUT_MS ?? 35000));

  try {
    const response = await fetch(`${config.baseUrl}/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: buildPrompt(question, language, hasImage, imageOcrText, history),
        stream: false,
        temperature: 0.2,
        ...(config.model ? { model: config.model } : {}),
      }),
      signal: controller.signal,
    });

    const raw = await response.text();
    if (!response.ok) throw new Error(`Aicoo returned HTTP ${response.status}`);

    const outputText = parseAicooOutputText(raw);
    const decision = outputText ? parseLooseDecision(outputText) : null;
    if (!decision) throw new Error("Aicoo response was not a structured safety decision.");

    decision.provider = "aicoo";
    if (!decision.observedText && imageOcrText) decision.observedText = imageOcrText;
    return decision;
  } catch (error) {
    console.error("Aicoo reasoning failed; falling back to Pollinations.", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function askReasoningModel(question: string, language: LanguageMode, imageDataUrl?: string, history: ConversationTurn[] = []) {
  const config = getPollinationsConfig();
  const model = imageDataUrl ? config.visionModel : config.model;
  const imageOcrText = imageDataUrl ? await extractPhotoText(imageDataUrl, language) : "";
  const aicooDecision = await askAicooReasoningModel(question, language, Boolean(imageDataUrl), imageOcrText, history);
  if (aicooDecision) return aicooDecision;

  const content: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: buildPrompt(question, language, Boolean(imageDataUrl), imageOcrText, history),
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

  let response: Response;
  let payload: Record<string, unknown>;

  try {
    response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are Herald. Return one valid JSON object only. Do not use arrays, markdown, comments, or trailing commas.",
          },
          {
            role: "user",
            content,
          },
        ],
        temperature: 0.2,
        max_tokens: 900,
        stream: false,
        response_format: { type: "json_object" },
      }),
    });
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    return safeFallbackWithOcr(question, language, "The hosted model was temporarily unavailable after OCR completed.", imageOcrText);
  }

  if (!response.ok) {
    return safeFallbackWithOcr(question, language, `The hosted model returned HTTP ${response.status} after OCR completed.`, imageOcrText);
  }

  const outputText = parseOutputText(payload);
  if (!outputText) return safeFallbackWithOcr(question, language, "The hosted model returned an empty response.", imageOcrText);

  const decision =
    parseLooseDecision(outputText) ??
    safeFallbackWithOcr(question, language, "The hosted model returned malformed JSON, so Herald did not expose the parsing error.", imageOcrText);

  decision.provider = "pollinations";

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

  if (!decision.observedText && imageOcrText) {
    decision.observedText = imageOcrText;
  }

  return decision;
}

export async function handleSafetyAsk(request: Request) {
  if (request.method !== "POST") {
    return Response.json({ error: "Use POST for safety questions." }, { status: 405 });
  }

  let body: { question?: string; language?: LanguageMode; imageDataUrl?: string; history?: unknown };

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
  const history = normalizeHistory(body.history);

  try {
    const decision = await askReasoningModel(
      question || "Please inspect this site photo and advise what the worker should do.",
      language,
      body.imageDataUrl,
      history,
    );
    const mode = decision.fallback
      ? "safety-fallback-votee-source-pack"
      : decision.provider === "aicoo"
        ? "aicoo-votee-source-pack"
        : "pollinations-votee-source-pack";

    return Response.json(
      {
        mode,
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
            ruleId: decision.fallback ? "safe-response-fallback" : "llm-reasoned-votee-source-pack",
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
    const decision = safeFallbackDecision(
      question || "site photo",
      language,
      error instanceof Error ? "The hosted model was temporarily unavailable." : "The hosted model failed unexpectedly.",
    );

    return Response.json(
      {
        mode: "safety-fallback-votee-source-pack",
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
            ruleId: "safe-response-fallback",
          },
        ],
        latencyMs: Math.max(45, Date.now() - startedAt),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
