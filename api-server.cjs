const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 4173);
const PUBLIC_DIR = path.join(__dirname, "public");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

const safetyRules = [
  {
    id: "fire-alarm",
    risk: "STOP",
    confidence: 0.97,
    notify: true,
    keywords: [
      "fire alarm",
      "alarm",
      "disable",
      "silence",
      "火警",
      "警報",
      "熄",
      "關閉",
      "熄咗",
      "唔響"
    ],
    answerYue:
      "唔好關閉火警警報。先停手，保留警報運作，搵負責人或消防相關合資格人員確認。除非有清楚批准同現場替代安全措施，唔好自己處理。",
    answerEn:
      "Do not disable the fire alarm. Stop the task, keep the alarm active, and escalate to the responsible person or qualified fire-safety contact. Do not proceed without explicit approval and a temporary safety plan.",
    steps: [
      "Stop the task and keep the alarm active.",
      "Move workers away from the affected area if there is any active risk.",
      "Call the site supervisor and record the reason for the request.",
      "Only continue after the supervisor documents approval and controls."
    ],
    citations: [
      {
        title: "Site Fire Safety SOP",
        source: "Votee Atlas source pack / Fire protection controls",
        excerpt:
          "Fire detection, warning, and evacuation systems must remain available unless a documented temporary impairment procedure is active."
      },
      {
        title: "Supervisor Escalation Rule",
        source: "Votee Atlas source pack / High-risk work decisions",
        excerpt:
          "Workers must escalate any request to bypass a safety system. The app should log the step and notify the responsible person."
      }
    ]
  },
  {
    id: "electrical-isolation",
    risk: "STOP",
    confidence: 0.94,
    notify: true,
    keywords: [
      "live wire",
      "live circuit",
      "electric",
      "electricity",
      "isolate",
      "lockout",
      "breaker",
      "電",
      "電線",
      "帶電",
      "電掣",
      "漏電"
    ],
    answerYue:
      "唔好掂帶電位置。先隔離電源、上鎖掛牌，再由合資格人員驗電。未驗明無電之前，當佢係帶電處理。",
    answerEn:
      "Do not touch or work on a potentially live circuit. Isolate power, lock out and tag out, then have a competent person test before work starts. Treat it as live until proven otherwise.",
    steps: [
      "Stop and create a safe boundary.",
      "Isolate the supply and apply lockout/tagout.",
      "Ask a competent person to test for dead.",
      "Log the isolation point and person responsible."
    ],
    citations: [
      {
        title: "Electrical Isolation SOP",
        source: "Votee Atlas source pack / Electrical work",
        excerpt:
          "Electrical work begins only after isolation, lockout/tagout, and testing by a competent person."
      }
    ]
  },
  {
    id: "working-height",
    risk: "CHECK",
    confidence: 0.89,
    notify: true,
    keywords: [
      "ladder",
      "scaffold",
      "roof",
      "height",
      "harness",
      "fall",
      "棚",
      "高空",
      "梯",
      "安全帶",
      "跌"
    ],
    answerYue:
      "可以做之前要先檢查防墮措施。梯、棚、安全帶同工作平台要啱用同穩陣；如果要伸手過遠、地面唔平、或者無人扶，停一停叫主管睇。",
    answerEn:
      "Check fall controls before working at height. The ladder, scaffold, harness, and platform must be fit for the task. If the surface is uneven, reach is awkward, or support is missing, pause and ask the supervisor.",
    steps: [
      "Confirm the access equipment is inspected and suitable.",
      "Check guardrails, tie-off points, and footing.",
      "Keep three points of contact where ladder work is allowed.",
      "Escalate if the setup forces overreaching or improvisation."
    ],
    citations: [
      {
        title: "Work-at-Height Checklist",
        source: "Votee Atlas source pack / Fall prevention",
        excerpt:
          "Work at height requires suitable access, fall prevention controls, and supervisor review when conditions change."
      }
    ]
  },
  {
    id: "confined-space",
    risk: "STOP",
    confidence: 0.95,
    notify: true,
    keywords: [
      "confined",
      "tank",
      "manhole",
      "drain",
      "sewer",
      "密閉",
      "沙井",
      "渠",
      "缸",
      "缺氧"
    ],
    answerYue:
      "唔好入密閉空間，除非已完成許可證、氣體測試、通風、救援安排同看守人。少一樣都停。",
    answerEn:
      "Do not enter a confined space unless permit, gas test, ventilation, rescue plan, and standby person are all confirmed. If any item is missing, stop.",
    steps: [
      "Stop entry and keep the opening controlled.",
      "Verify permit and atmospheric test results.",
      "Confirm ventilation and rescue equipment.",
      "Assign a standby person before anyone enters."
    ],
    citations: [
      {
        title: "Confined Space Permit Rule",
        source: "Votee Atlas source pack / Confined spaces",
        excerpt:
          "Entry requires documented permit controls, atmospheric testing, ventilation, rescue readiness, and standby supervision."
      }
    ]
  },
  {
    id: "hot-work",
    risk: "CHECK",
    confidence: 0.86,
    notify: true,
    keywords: [
      "weld",
      "welding",
      "grind",
      "hot work",
      "spark",
      "燒焊",
      "打磨",
      "火花",
      "熱工序"
    ],
    answerYue:
      "做熱工序之前要有熱工許可、清走易燃物、準備滅火器同安排火種監察。無 permit 就唔好開工。",
    answerEn:
      "Before hot work, confirm a hot-work permit, remove flammables, prepare extinguishers, and arrange fire watch. Do not start without the permit.",
    steps: [
      "Check hot-work permit status.",
      "Remove or cover combustible materials.",
      "Place extinguisher and fire watch.",
      "Log start time and permit owner."
    ],
    citations: [
      {
        title: "Hot Work Permit SOP",
        source: "Votee Atlas source pack / Fire prevention",
        excerpt:
          "Hot work requires permit approval, combustible control, extinguishing equipment, and a fire watch."
      }
    ]
  },
  {
    id: "general",
    risk: "CHECK",
    confidence: 0.72,
    notify: false,
    keywords: [],
    answerYue:
      "我未有足夠資料直接批准。講多啲：你做緊咩工序、位置、見到咩危險、同有冇主管或 permit？安全唔肯定就先停手。",
    answerEn:
      "I do not have enough context to approve this. Tell me the task, location, hazard, and whether a supervisor or permit is present. If safety is uncertain, pause first.",
    steps: [
      "Pause if the task could affect people, power, fire systems, gas, height, or moving equipment.",
      "Add a photo or describe the site condition.",
      "Escalate when unsure."
    ],
    citations: [
      {
        title: "Stop-Work Principle",
        source: "Votee Atlas source pack / General safety",
        excerpt:
          "When a worker is unsure about a high-risk task, the safe default is to pause and ask before continuing."
      }
    ]
  }
];

const demoLogs = [];

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function pickRule(question) {
  const normalized = String(question || "").toLowerCase();
  const scored = safetyRules
    .filter(rule => rule.id !== "general")
    .map(rule => ({
      rule,
      score: rule.keywords.reduce((total, keyword) => {
        return normalized.includes(keyword.toLowerCase()) ? total + 1 : total;
      }, 0)
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].rule : safetyRules.find(rule => rule.id === "general");
}

function buildLocalAnswer(question, language = "auto") {
  const rule = pickRule(question);
  const wantsCantonese =
    language === "yue" || /[\u3400-\u9fff]/.test(String(question || ""));
  const answer = wantsCantonese ? rule.answerYue : rule.answerEn;
  const now = new Date();
  const logEntry = {
    id: `LOG-${now.getTime().toString(36).toUpperCase()}`,
    time: now.toISOString(),
    question,
    risk: rule.risk,
    ruleId: rule.id,
    notified: rule.notify
  };
  demoLogs.unshift(logEntry);
  demoLogs.splice(12);

  return {
    mode: "votee-source-pack",
    brand: "Herald",
    tagline: "AI for Physical Workers",
    question,
    risk: rule.risk,
    confidence: rule.confidence,
    answer,
    language: wantsCantonese ? "yue" : "en",
    steps: rule.steps,
    citations: rule.citations,
    supervisor: rule.notify
      ? {
          status: "notified",
          name: "Site Supervisor",
          channel: "SMS / WhatsApp demo",
          message: `Worker asked: "${question}". Herald marked ${rule.risk}.`
        }
      : {
          status: "ready",
          name: "Site Supervisor",
          channel: "Escalate manually",
          message: "No automatic notification needed for this demo answer."
        },
    logEntry,
    logs: demoLogs,
    disclaimer:
      "Prototype demo only. Source-pack answers are structured for Beever Atlas; verify production answers with qualified safety and legal professionals."
  };
}

async function callAtlas(question) {
  const atlasUrl = process.env.ATLAS_URL;
  const atlasKey = process.env.ATLAS_KEY || "dev-key-change-me";
  const channel = process.env.ATLAS_CHANNEL || "site-safety";

  if (!atlasUrl) return null;

  const endpoint = `${atlasUrl.replace(/\/$/, "")}/api/channels/${encodeURIComponent(channel)}/ask`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${atlasKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ question })
  });

  if (!response.ok) {
    throw new Error(`Atlas returned ${response.status}`);
  }

  const text = await response.text();
  return {
    mode: "beever-atlas",
    risk: "CHECK",
    confidence: 0.82,
    answer: text.replace(/^data:\s*/gm, "").trim() || "Atlas returned an empty answer.",
    steps: ["Review the cited answer.", "Escalate before any high-risk action.", "Log the final decision."],
    citations: [
      {
        title: "Beever Atlas Memory",
        source: `${atlasUrl} / ${channel}`,
        excerpt: "Answer retrieved from the configured Atlas channel."
      }
    ],
    supervisor: {
      status: "ready",
      name: "Site Supervisor",
      channel: "Manual escalation",
      message: "Atlas mode completed. Escalate if the answer blocks or changes work."
    },
    logEntry: {
      id: `ATLAS-${Date.now().toString(36).toUpperCase()}`,
      time: new Date().toISOString(),
      question,
      risk: "CHECK",
      ruleId: "atlas",
      notified: false
    },
    logs: demoLogs,
    disclaimer:
      "Prototype Atlas integration. Production use needs reviewed source packs and safety controls."
  };
}

async function handleAsk(req, res) {
  try {
    const body = await parseBody(req);
    const started = Date.now();
    const question = String(body.question || "").trim();
    if (!question) {
      sendJson(res, 400, { error: "Question is required." });
      return;
    }

    let result = null;
    if (body.mode === "atlas" || process.env.ATLAS_URL) {
      try {
        result = await callAtlas(question);
      } catch (error) {
        result = buildLocalAnswer(question, body.language);
        result.mode = "local-demo-fallback";
        result.atlasError = error.message;
      }
    }

    if (!result) {
      result = buildLocalAnswer(question, body.language);
    }

    result.latencyMs = Date.now() - started;
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Unexpected error" });
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (error.code === "ENOENT") {
        fs.readFile(path.join(PUBLIC_DIR, "index.html"), (fallbackError, fallbackData) => {
          if (fallbackError) {
            res.writeHead(404);
            res.end("Not found");
            return;
          }
          res.writeHead(200, { "Content-Type": mimeTypes[".html"] });
          res.end(fallbackData);
        });
        return;
      }
      res.writeHead(500);
      res.end("Server error");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/ask") {
    handleAsk(req, res);
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405);
  res.end("Method not allowed");
});

server.listen(PORT, () => {
  console.log(`Herald prototype running at http://localhost:${PORT}`);
  if (process.env.ATLAS_URL) {
    console.log(`Atlas proxy enabled: ${process.env.ATLAS_URL}`);
  }
});
