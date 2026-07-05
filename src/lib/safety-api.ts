import { askBeeverAtlas, isBeeverAtlasConfigured } from "./beever-atlas-client";

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
};

const sourcePack = [
  {
    id: "fire-protection-controls",
    title: "Site Fire Safety SOP",
    content:
      "Fire detection, warning, and evacuation systems must remain available unless a documented temporary impairment procedure is active. Workers must not disable alarms without supervisor approval, temporary controls, and a compliance log.",
  },
  {
    id: "high-risk-escalation",
    title: "Supervisor Escalation Rule",
    content:
      "Workers must escalate any request to bypass a safety system. The app should log the worker question, decision, citation, responsible supervisor, and final action.",
  },
  {
    id: "electrical-isolation",
    title: "Electrical Isolation SOP",
    content:
      "Electrical work begins only after isolation, lockout/tagout, and testing by a competent person. Treat equipment as live until proven otherwise.",
  },
  {
    id: "work-at-height",
    title: "Work-at-Height Checklist",
    content:
      "Work at height requires suitable access, fall prevention controls, stable footing, inspected equipment, and supervisor review when conditions change.",
  },
  {
    id: "hot-work-permit",
    title: "Hot Work Permit SOP",
    content:
      "Hot work requires permit approval, combustible control, extinguishing equipment, and a fire watch before work starts.",
  },
];

function hasCjk(text: string) {
  return /[\u3400-\u9fff]/.test(text);
}

function buildVoteeReasoningPrompt(question: string, language: LanguageMode, photoAttached: boolean) {
  const outputLanguage = language === "yue" ? "Cantonese, Hong Kong style" : "English";
  const photoContext = photoAttached
    ? "The worker attached a site photo, but the backend only receives a photo marker. Ask for visible details if the image content is necessary."
    : "No photo was attached.";

  return [
    "You are Herald, an AI safety copilot for physical workers: firefighters, EMTs, utility crews, warehouse teams, maintenance workers, construction crews, facilities staff, and field operators.",
    "Reason from the worker's natural-language question and the safety source pack. Do not choose from canned examples. Do not copy a predefined answer. Make a fresh decision for this exact situation.",
    "Use deep reasoning across the available context. If the worker gives too little context, choose ASK and ask for the missing details instead of guessing.",
    "Classify the decision as one of:",
    "- STOP: immediate serious harm, unsafe bypass, energy isolation, emergency, confined space, fire/smoke, live electrical, fall, unknown high-risk condition.",
    "- CHECK: potentially manageable only after verification, permit, PPE, supervisor, area control, or source-pack confirmation.",
    "- OK: ordinary low-risk task where the worker can proceed only if normal controls match the site.",
    "- ASK: insufficient location/task/hazard detail to make a safe call.",
    `Return the worker-facing content in ${outputLanguage}. Keep it concise enough for a phone screen.`,
    photoContext,
    "Return ONLY valid JSON. Do not wrap it in markdown. The JSON schema is:",
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
            title: "source title",
            source: "source id or Beever Atlas citation",
            excerpt: "short supporting excerpt",
          },
        ],
      },
      null,
      2,
    ),
    "Safety source pack available to the model:",
    JSON.stringify(sourcePack, null, 2),
    `Worker question: ${question}`,
  ].join("\n\n");
}

function extractJson(text: string) {
  const withoutFence = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) return null;
  return withoutFence.slice(start, end + 1);
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 5);
}

function normalizeRisk(value: unknown): Risk | null {
  const risk = String(value ?? "").toUpperCase();
  if (risk === "STOP" || risk === "CHECK" || risk === "OK" || risk === "ASK") return risk;
  return null;
}

function normalizeCitations(value: unknown, atlasCitations: Citation[]) {
  const parsed = Array.isArray(value)
    ? value
        .map((item, index) => {
          const citation = (item ?? {}) as Record<string, unknown>;
          return {
            title: String(citation.title ?? `Votee reasoning citation ${index + 1}`),
            source: String(citation.source ?? "Beever Atlas"),
            excerpt: String(citation.excerpt ?? ""),
          };
        })
        .filter((item) => item.title || item.excerpt)
        .slice(0, 4)
    : [];

  if (parsed.length) return parsed;
  if (atlasCitations.length) return atlasCitations.slice(0, 4);

  return [
    {
      title: "Votee Beever Atlas",
      source: "ask_channel(mode=deep)",
      excerpt: "Decision generated by live Beever Atlas reasoning from the worker question and safety source context.",
    },
  ];
}

function parseLlmDecision(answer: string, atlasCitations: Citation[]): LlmSafetyDecision | null {
  const json = extractJson(answer);
  if (!json) return null;

  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const risk = normalizeRisk(parsed.risk);
    const workerAnswer = String(parsed.answer ?? "").trim();
    if (!risk || !workerAnswer) return null;

    const supervisor = (parsed.supervisor ?? {}) as Record<string, unknown>;

    return {
      risk,
      answer: workerAnswer,
      steps: asStringArray(parsed.steps),
      reasoning: asStringArray(parsed.reasoning),
      supervisor: {
        status: String(supervisor.status ?? (risk === "STOP" ? "Required" : risk === "CHECK" ? "Recommended" : "Optional")),
        message: String(supervisor.message ?? "Supervisor review depends on the model decision."),
      },
      citations: normalizeCitations(parsed.citations, atlasCitations),
    };
  } catch {
    return null;
  }
}

async function getVoteeDecision(question: string, language: LanguageMode, photoAttached: boolean) {
  const atlas = await askBeeverAtlas(buildVoteeReasoningPrompt(question, language, photoAttached));
  if (!atlas?.answer?.trim()) return null;

  const parsed = parseLlmDecision(atlas.answer, atlas.citations);
  if (!parsed) {
    throw new Error("Votee returned an answer, but not the structured reasoning JSON Herald needs.");
  }

  if (!parsed.steps.length) {
    parsed.steps = ["Pause and confirm the site condition.", "Escalate to a competent supervisor if risk is unclear."];
  }

  if (!parsed.reasoning.length) {
    parsed.reasoning = ["Votee Beever Atlas generated this decision from the worker question and safety source context."];
  }

  return parsed;
}

export async function handleSafetyAsk(request: Request) {
  if (request.method !== "POST") {
    return Response.json({ error: "Use POST for safety questions." }, { status: 405 });
  }

  let body: { question?: string; language?: LanguageMode; photoAttached?: boolean };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return Response.json({ error: "Ask a safety question first." }, { status: 400 });
  }

  if (!isBeeverAtlasConfigured()) {
    return Response.json(
      {
        error:
          "Live Votee/Beever LLM reasoning is not configured. Add BEEVER_MCP_KEY plus BEEVER_MCP_URL and BEEVER_CHANNEL_ID or BEEVER_CHANNEL_NAME in Vercel. This build no longer uses predefined local answers.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const startedAt = Date.now();
  const language: LanguageMode = body.language === "en" && !hasCjk(question) ? "en" : "yue";

  try {
    const decision = await getVoteeDecision(question, language, Boolean(body.photoAttached));

    return Response.json(
      {
        mode: "beever-atlas",
        risk: decision.risk,
        answer: decision.answer,
        language,
        steps: decision.steps,
        citations: decision.citations,
        reasoning: decision.reasoning,
        supervisor: decision.supervisor,
        logs: [
          {
            id: `LOG-${startedAt}`,
            time: new Date(startedAt).toISOString(),
            question,
            risk: decision.risk,
            ruleId: "votee-llm-reasoned",
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
    console.error("Votee reasoning failed.", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Votee/Beever reasoning failed. Try again after confirming the Atlas MCP server and channel are available.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
