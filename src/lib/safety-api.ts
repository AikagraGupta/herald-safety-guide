import { askBeeverAtlas } from "./beever-atlas-client";

type LanguageMode = "yue" | "en";
type Risk = "STOP" | "CHECK" | "OK" | "ASK";

type Rule = {
  id: string;
  risk: Exclude<Risk, "ASK">;
  keywords: string[];
  en: { answer: string; steps: string[] };
  yue: { answer: string; steps: string[] };
  citations: Array<{ title: string; source: string; excerpt: string }>;
};

const rules: Rule[] = [
  {
    id: "firefighter-low-air-smoke-entry",
    risk: "STOP",
    keywords: ["firefighter", "scba", "low air", "air alarm", "smoky room", "smoke-filled", "mayday", "煙", "空氣樽", "呼吸器", "低氣壓"],
    en: {
      answer:
        "Stop advancing. A low-air alarm or SCBA concern in smoke is an immediate withdrawal and crew-accountability situation, not a push-forward moment.",
      steps: [
        "Tell your partner and officer immediately.",
        "Begin controlled withdrawal while maintaining crew contact.",
        "Call Mayday or emergency traffic if you are disoriented, trapped, separated, or cannot exit safely.",
      ],
    },
    yue: {
      answer: "停低，唔好再推前。煙入面呼吸器低氣壓或有問題，要即刻撤出並做隊員點名，唔係繼續入去。",
      steps: ["即刻通知拍檔同指揮／隊長。", "保持隊員接觸，有控制咁撤出。", "如果迷路、被困、失散或出唔到，要即刻發出緊急求救。"],
    },
    citations: [
      {
        title: "Votee Safety Atlas",
        source: "Firefighter respiratory protection",
        excerpt: "Low-air and SCBA warnings require immediate crew communication, withdrawal, and emergency escalation if exit is compromised.",
      },
    ],
  },
  {
    id: "fire-alarm-disable",
    risk: "STOP",
    keywords: ["fire alarm", "alarm", "disable", "silence", "smoke", "sprinkler", "火警", "警報", "關閉", "熄"],
    en: {
      answer:
        "Stop. Do not disable a fire alarm or life-safety system unless a competent supervisor has issued a controlled permit and temporary protection is active.",
      steps: [
        "Pause the task and keep the alarm active.",
        "Tell the site supervisor or fire safety lead now.",
        "If work must continue, wait for a documented isolation permit and fire watch.",
      ],
    },
    yue: {
      answer: "停一停。唔好自行關閉火警警報或生命安全系統，除非主管已批出受控許可，並有臨時保護措施。",
      steps: ["先停工，保持警報運作。", "即刻通知地盤主管或消防安全負責人。", "如一定要繼續，等書面隔離許可同火警監察安排。"],
    },
    citations: [
      {
        title: "Votee Safety Atlas",
        source: "Fire protection controls",
        excerpt: "Life-safety alarms require supervisor-controlled isolation and temporary protection.",
      },
      {
        title: "Site Safety Playbook",
        source: "Emergency systems",
        excerpt: "Workers should escalate before bypassing alarms, sprinklers, or detection systems.",
      },
    ],
  },
  {
    id: "live-electrical-work",
    risk: "STOP",
    keywords: ["live wire", "electric", "electrical", "voltage", "breaker", "socket", "cable", "帶電", "電線", "漏電", "電掣", "電箱", "插座"],
    en: {
      answer: "Stop. Treat the circuit as live until it is isolated, locked out, tagged, and tested by an authorized person.",
      steps: [
        "Move hands and tools away from the circuit.",
        "Ask an authorized person to isolate and lock out the supply.",
        "Resume only after test-before-touch confirmation.",
      ],
    },
    yue: {
      answer: "停工。當條線仍然帶電處理，直到合資格人員完成隔離、上鎖、掛牌同測試。",
      steps: ["手同工具離開電路。", "搵合資格人員隔離電源並上鎖掛牌。", "確認先測試、後接觸之後先可以繼續。"],
    },
    citations: [
      {
        title: "Votee Safety Atlas",
        source: "Electrical isolation",
        excerpt: "Live electrical work needs lockout, tagout, and verification before contact.",
      },
    ],
  },
  {
    id: "height-scaffold-control",
    risk: "CHECK",
    keywords: ["height", "ladder", "scaffold", "harness", "edge", "roof", "lift", "棚", "棚架", "高空", "梯", "安全帶", "天台"],
    en: {
      answer: "Check before starting. Work at height needs a stable platform, edge protection, and fall protection where required.",
      steps: [
        "Inspect the scaffold, ladder, or platform before climbing.",
        "Confirm guardrails, toe boards, and access are secure.",
        "Use fall protection if there is an exposed edge or incomplete platform.",
      ],
    },
    yue: {
      answer: "開工前要檢查。高空工作要有穩固工作台、邊緣保護，按需要使用防墮設備。",
      steps: ["上去前檢查棚架、梯或工作台。", "確認扶手、踢腳板同通道穩陣。", "如有開邊或未完成平台，要用防墮設備。"],
    },
    citations: [
      {
        title: "Votee Safety Atlas",
        source: "Work at height",
        excerpt: "Falls are controlled through planning, inspected access, and fall prevention.",
      },
    ],
  },
  {
    id: "confined-space-entry",
    risk: "STOP",
    keywords: ["confined", "manhole", "tank", "oxygen", "gas test", "drain", "sewer", "密閉", "沙井", "渠", "缺氧", "氣體"],
    en: {
      answer: "Stop. Confined space entry needs a permit, atmospheric testing, ventilation, standby support, and rescue arrangements.",
      steps: [
        "Do not enter until the permit is active.",
        "Confirm gas testing and ventilation are complete.",
        "Make sure a standby person and rescue plan are in place.",
      ],
    },
    yue: {
      answer: "停工。入密閉空間前要有許可、氣體測試、通風、看守人同救援安排。",
      steps: ["許可未生效就唔好入。", "確認已做氣體測試同通風。", "確保有人看守，並有救援計劃。"],
    },
    citations: [
      {
        title: "Votee Safety Atlas",
        source: "Confined space entry",
        excerpt: "Entry requires permits, atmospheric controls, attendants, and emergency planning.",
      },
    ],
  },
  {
    id: "hot-work-permit",
    risk: "CHECK",
    keywords: ["weld", "grind", "spark", "hot work", "torch", "cutting", "燒焊", "打磨", "火花", "熱工序", "切割"],
    en: {
      answer: "Check the permit. Hot work should start only after combustibles are cleared, extinguishers are ready, and fire watch is assigned.",
      steps: [
        "Confirm the hot-work permit covers this area and time.",
        "Clear or cover combustible materials.",
        "Keep extinguishers nearby and assign fire watch after the task.",
      ],
    },
    yue: {
      answer: "先查許可。熱工序要清走易燃物、準備滅火器，並安排火警監察。",
      steps: ["確認熱工序許可包括呢個位置同時間。", "清走或遮蓋易燃物料。", "滅火器放近身，完工後安排火警監察。"],
    },
    citations: [
      {
        title: "Votee Safety Atlas",
        source: "Hot work controls",
        excerpt: "Hot work permits help control ignition sources and post-work fire risk.",
      },
    ],
  },
  {
    id: "slip-trip-condition",
    risk: "CHECK",
    keywords: ["slip", "trip", "wet floor", "spill", "blocked", "obstruction", "leak", "滑", "跣", "水漬", "漏水", "阻住", "絆倒"],
    en: {
      answer: "Check and control the area first. Do not just walk through a slip, trip, or blocked-access hazard.",
      steps: [
        "Stop people entering the affected area.",
        "Mark or isolate the hazard with cones, tape, or a spotter.",
        "Clean, dry, or clear the path before work continues.",
      ],
    },
    yue: {
      answer: "先檢查同控制範圍。見到跣腳、絆倒或通道阻塞風險，唔好照行照做。",
      steps: ["先阻止其他人入受影響範圍。", "用雪糕筒、警示帶或安排人手睇住。", "清理、抹乾或移走阻塞物之後先繼續。"],
    },
    citations: [
      {
        title: "Votee Safety Atlas",
        source: "Housekeeping and access",
        excerpt: "Access routes should be kept clear, dry, marked, and controlled before work continues.",
      },
    ],
  },
];

const okCopy = {
  en: {
    answer: "This sounds manageable, but only proceed if the briefing, PPE, and supervisor instructions match the site condition.",
    steps: [
      "Confirm the method statement or task briefing matches what you see.",
      "Wear the required PPE for the area.",
      "Stop and ask again if the condition changes or feels unsafe.",
    ],
  },
  yue: {
    answer: "聽落可以處理，但只有喺工作簡報、個人防護裝備同主管指示都同現場情況一致時先好繼續。",
    steps: ["確認施工方案或工作簡報同現場一致。", "穿戴該區域要求嘅個人防護裝備。", "如果情況有變或者覺得唔安全，要停低再問。"],
  },
};

const contextWords = {
  en: [
    "work",
    "use",
    "move",
    "lift",
    "carry",
    "cut",
    "enter",
    "open",
    "repair",
    "install",
    "site",
    "floor",
    "room",
    "roof",
    "near",
    "inside",
    "outside",
    "unsafe",
    "danger",
    "broken",
    "loose",
    "leak",
    "smell",
    "noise",
  ],
  yue: ["做", "搬", "拎", "入", "開", "整", "裝", "上", "落", "地盤", "房", "樓", "天台", "附近", "入面", "出面", "危險", "爛", "鬆", "漏", "味", "聲"],
};

function hasCjk(text: string) {
  return /[\u3400-\u9fff]/.test(text);
}

function chooseRule(question: string) {
  const normalized = question.toLowerCase();
  return rules.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) ?? null;
}

function isContextEnough(question: string, language: LanguageMode, photoAttached = false) {
  const normalized = question.toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  const enoughLength = hasCjk(question) ? question.replace(/\s/g, "").length >= 12 : words.length >= 6;
  const hasSignal = contextWords[language].some((word) => normalized.includes(word.toLowerCase()));
  const asksAboutAction = /[?？]|can i|should i|is it safe|可唔可以|可不可以|應唔應該|得唔得/.test(normalized);

  return photoAttached || (enoughLength && (hasSignal || asksAboutAction));
}

function contextResponse(question: string, language: LanguageMode, startedAt: number) {
  const isYue = language === "yue";

  return Response.json(
    {
      mode: "votee-source-pack",
      risk: "ASK",
      answer: isYue
        ? "我未有足夠現場資料，唔應該亂俾安全判斷。講多兩三句：你喺邊度、做緊咩、見到咩危險？"
        : "I need more site context before giving a safety decision. Tell me where you are, what task you are doing, and what looks unsafe.",
      language,
      steps: isYue
        ? ["講位置：例如樓層、房間、天台、沙井或設備旁邊。", "講動作：你準備做咩或想唔想繼續。", "講危險：見到水、電、煙、鬆脫、氣味、火花或其他異常。"]
        : ["Add the location: floor, room, roof, manhole, or equipment area.", "Add the action: what you are about to do or whether you want to continue.", "Add the hazard: water, electricity, smoke, loose parts, smell, sparks, or anything unusual."],
      citations: [],
      supervisor: {
        status: "Not sent",
        message: isYue ? "未夠資料，暫時唔通知主管；補充現場資料後再判斷。" : "Not enough context to notify a supervisor yet; add site details first.",
      },
      logs: [
        {
          id: `LOG-${startedAt}`,
          time: new Date(startedAt).toISOString(),
          question,
          risk: "ASK",
          ruleId: "needs-more-context",
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
}

function atlasPrompt(question: string, language: LanguageMode, risk: Exclude<Risk, "ASK">) {
  const outputLanguage = language === "yue" ? "Cantonese, Hong Kong style" : "English";

  return [
    "You are Herald, an AI safety guide for all physical workers: firefighters, EMTs, utility crews, warehouse teams, maintenance workers, construction crews, and field operators.",
    "Use Beever Atlas channel knowledge to give a cited, practical safety answer. If the channel does not contain enough domain evidence, say what source context is missing.",
    `Return the answer in ${outputLanguage}.`,
    `The app's risk router classified this as ${risk}. Do not downgrade a STOP or CHECK classification.`,
    "Keep it short enough to read on a phone. Include concrete next actions.",
    `Worker question: ${question}`,
  ].join("\n");
}

async function getAtlasAnswer(question: string, language: LanguageMode, risk: Exclude<Risk, "ASK">) {
  try {
    const atlas = await askBeeverAtlas(atlasPrompt(question, language, risk));
    if (!atlas?.answer?.trim()) return null;
    return atlas;
  } catch (error) {
    console.warn("Beever Atlas unavailable; using local safety source pack.", error);
    return null;
  }
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

  const startedAt = Date.now();
  const language: LanguageMode = body.language === "en" && !hasCjk(question) ? "en" : "yue";
  const rule = chooseRule(question);

  if (!rule && !isContextEnough(question, language, body.photoAttached)) {
    return contextResponse(question, language, startedAt);
  }

  const copy = rule ? rule[language] : okCopy[language];
  const risk = rule?.risk ?? "OK";
  const atlas = await getAtlasAnswer(question, language, risk);
  const riskLabel = risk === "OK" ? "READY" : risk;
  const photoStep =
    language === "yue"
      ? "已收到相片標記；現場仍要由主管確認。"
      : "Photo marker received; the site condition still needs supervisor confirmation.";

  return Response.json(
    {
      mode: atlas ? "beever-atlas" : "votee-source-pack",
      risk,
      answer: atlas?.answer ?? copy.answer,
      language,
      steps: body.photoAttached ? [...copy.steps, photoStep] : copy.steps,
      citations: atlas?.citations.length ? atlas.citations : rule?.citations ?? [
        {
          title: "Votee Safety Atlas",
          source: "General task readiness",
          excerpt: "Workers should verify task controls, PPE, and escalation routes before starting.",
        },
      ],
      supervisor: {
        status: risk === "STOP" ? "Required" : risk === "CHECK" ? "Recommended" : "Optional",
        message:
          language === "yue"
            ? `${riskLabel} 個案已準備好交俾主管覆核。`
            : `${riskLabel} case is ready for supervisor review.`,
      },
      logs: [
        {
          id: `LOG-${startedAt}`,
          time: new Date(startedAt).toISOString(),
          question,
          risk,
          ruleId: rule?.id ?? "general-task-readiness",
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
}
