type JsonRpcResponse<T> = {
  result?: T;
  error?: {
    code?: number;
    message?: string;
    data?: unknown;
  };
};

type McpToolContent = {
  type?: string;
  text?: string;
  [key: string]: unknown;
};

type McpToolResult = {
  content?: McpToolContent[];
  structuredContent?: unknown;
  [key: string]: unknown;
};

type AtlasCitation = {
  title: string;
  source: string;
  excerpt: string;
};

type AtlasAnswer = {
  answer: string;
  citations: AtlasCitation[];
  followUps: string[];
  channelId: string;
  metadata?: unknown;
};

type AtlasConfig = {
  url: string;
  key: string;
  channelId?: string;
  channelName?: string;
  mode: "quick" | "deep" | "summarize";
};

let cachedChannelId: string | undefined;

function getAtlasConfig(): AtlasConfig | null {
  const baseUrl = process.env.BEEVER_MCP_URL ?? process.env.ATLAS_MCP_URL;
  const atlasUrl = process.env.ATLAS_URL;
  const key = process.env.BEEVER_MCP_KEY ?? process.env.ATLAS_KEY ?? process.env.BEEVER_API_KEY;

  if (!key) return null;

  return {
    url: baseUrl ?? (atlasUrl ? `${atlasUrl.replace(/\/$/, "")}/mcp` : "http://localhost:8000/mcp"),
    key,
    channelId: process.env.BEEVER_CHANNEL_ID ?? process.env.ATLAS_CHANNEL_ID ?? process.env.ATLAS_CHANNEL,
    channelName: process.env.BEEVER_CHANNEL_NAME ?? process.env.ATLAS_CHANNEL_NAME,
    mode: (process.env.BEEVER_ASK_MODE as AtlasConfig["mode"]) ?? "deep",
  };
}

export function isBeeverAtlasConfigured() {
  return Boolean(getAtlasConfig());
}

async function mcpRequest<T>(
  config: AtlasConfig,
  method: string,
  params?: unknown,
  sessionId?: string,
  signal?: AbortSignal,
) {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Beever Atlas MCP ${method} failed with HTTP ${response.status}`);
  }

  const sessionHeader = response.headers.get("mcp-session-id") ?? response.headers.get("Mcp-Session-Id") ?? undefined;
  const text = await response.text();
  const payload = parseMcpPayload<JsonRpcResponse<T>>(text);

  if (payload.error) {
    throw new Error(payload.error.message ?? `Beever Atlas MCP ${method} returned an error`);
  }

  return { result: payload.result as T, sessionId: sessionHeader };
}

function parseMcpPayload<T>(text: string): T {
  const trimmed = text.trim();
  if (!trimmed) return {} as T;

  if (trimmed.startsWith("event:") || trimmed.startsWith("data:")) {
    const dataLine = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .reverse()
      .find((line) => line.startsWith("data:"));

    if (dataLine) {
      return JSON.parse(dataLine.slice(5).trim()) as T;
    }
  }

  return JSON.parse(trimmed) as T;
}

async function initializeSession(config: AtlasConfig, signal: AbortSignal) {
  try {
    const initialized = await mcpRequest(
      config,
      "initialize",
      {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "sifu-safety-guide",
          version: "0.1.0",
        },
      },
      undefined,
      signal,
    );
    return initialized.sessionId;
  } catch {
    return undefined;
  }
}

async function callTool<T>(config: AtlasConfig, name: string, args: Record<string, unknown>, sessionId: string | undefined, signal: AbortSignal) {
  const { result } = await mcpRequest<McpToolResult>(
    config,
    "tools/call",
    {
      name,
      arguments: args,
    },
    sessionId,
    signal,
  );

  return unwrapToolResult<T>(result);
}

function unwrapToolResult<T>(result: McpToolResult | undefined): T {
  if (!result) return {} as T;

  if (result.structuredContent) {
    return result.structuredContent as T;
  }

  const text = result.content?.find((item) => item.type === "text" && item.text)?.text;
  if (!text) return result as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return { answer: text } as T;
  }
}

async function resolveChannelId(config: AtlasConfig, sessionId: string | undefined, signal: AbortSignal) {
  if (config.channelId) return config.channelId;
  if (cachedChannelId) return cachedChannelId;

  const whoami = await callTool<{ connections?: string[] }>(config, "whoami", {}, sessionId, signal);
  const connections = whoami.connections ?? [];

  for (const connectionId of connections) {
    const channelList = await callTool<{
      channels?: Array<{ channel_id: string; name?: string; sync_status?: string }>;
    }>(config, "list_channels", { connection_id: connectionId }, sessionId, signal);
    const channels = channelList.channels ?? [];
    if (!channels.length) continue;

    const selected =
      channels.find((channel) => channel.channel_id === config.channelName || channel.name === config.channelName) ??
      channels.find((channel) => channel.name === "demo-wikipedia") ??
      channels.find((channel) => channel.sync_status === "done") ??
      channels[0];

    cachedChannelId = selected.channel_id;
    return cachedChannelId;
  }

  throw new Error("No Beever Atlas channel is accessible for this MCP key.");
}

function normalizeCitations(citations: unknown): AtlasCitation[] {
  if (!Array.isArray(citations)) return [];

  return citations.slice(0, 4).map((citation, index) => {
    if (typeof citation === "string") {
      return {
        title: `Beever Atlas citation ${index + 1}`,
        source: "ask_channel",
        excerpt: citation,
      };
    }

    const item = citation as Record<string, unknown>;
    return {
      title: String(item.title ?? item.source ?? item.fact_id ?? `Beever Atlas citation ${index + 1}`),
      source: String(item.source ?? item.url ?? item.permalink ?? "ask_channel"),
      excerpt: String(item.excerpt ?? item.text ?? item.memory_text ?? item.snippet ?? ""),
    };
  });
}

function normalizeAskChannelResult(result: unknown, channelId: string): AtlasAnswer {
  if (typeof result === "string") {
    return { answer: result, citations: [], followUps: [], channelId };
  }

  const item = (result ?? {}) as Record<string, unknown>;
  return {
    answer: String(item.answer ?? item.response ?? item.text ?? ""),
    citations: normalizeCitations(item.citations),
    followUps: Array.isArray(item.follow_ups) ? item.follow_ups.map(String) : [],
    metadata: item.metadata,
    channelId,
  };
}

export async function askBeeverAtlas(question: string) {
  const config = getAtlasConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.BEEVER_TIMEOUT_MS ?? 25000));

  try {
    const sessionId = await initializeSession(config, controller.signal);
    const channelId = await resolveChannelId(config, sessionId, controller.signal);
    const result = await callTool<unknown>(
      config,
      "ask_channel",
      {
        channel_id: channelId,
        question,
        mode: config.mode,
      },
      sessionId,
      controller.signal,
    );

    return normalizeAskChannelResult(result, channelId);
  } finally {
    clearTimeout(timeout);
  }
}
