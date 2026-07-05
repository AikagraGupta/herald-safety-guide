import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BadgeHelp,
  BookOpenCheck,
  Camera,
  CheckCircle2,
  ClipboardList,
  Image as ImageIcon,
  Mic,
  RadioTower,
  RefreshCcw,
  Send,
  ShieldCheck,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

type Citation = {
  title: string;
  source: string;
  excerpt: string;
};

type Supervisor = {
  status: string;
  message: string;
};

type LogEntry = {
  id: string;
  time: string;
  question: string;
  risk: string;
  ruleId: string;
};

type AskResult = {
  mode: string;
  risk: "STOP" | "CHECK" | "OK" | "ASK";
  answer: string;
  language?: "yue" | "en";
  steps: string[];
  citations: Citation[];
  reasoning?: string[];
  observedText?: string;
  supervisor: Supervisor;
  logs: LogEntry[];
  latencyMs: number;
};

type LanguageMode = "yue" | "en";

type ChatTurn = {
  role: "worker" | "herald";
  content: string;
  risk?: AskResult["risk"];
  time: string;
};

const MEMORY_STORAGE_KEY = "herald-session-memory-v1";

const riskStyles = {
  STOP: "border-[var(--danger)]/25 bg-[var(--danger)]/10 text-[var(--danger)]",
  CHECK: "border-[var(--gold)]/30 bg-[var(--gold)]/12 text-[var(--gold)]",
  OK: "border-emerald-700/20 bg-emerald-700/10 text-emerald-700",
  ASK: "border-[var(--border-strong)] bg-[var(--panel)] text-foreground",
};

const riskIcon = {
  STOP: AlertTriangle,
  CHECK: ShieldCheck,
  OK: CheckCircle2,
  ASK: BadgeHelp,
};

function normalizeSavedMemory(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-10)
    .map((turn) => {
      const item = turn as Record<string, unknown>;
      const role = item.role === "herald" ? "herald" : item.role === "worker" ? "worker" : null;
      const content = typeof item.content === "string" ? item.content.trim() : "";
      const risk = ["STOP", "CHECK", "OK", "ASK"].includes(String(item.risk)) ? (String(item.risk) as AskResult["risk"]) : undefined;
      const time = typeof item.time === "string" ? item.time : new Date().toISOString();
      if (!role || !content) return null;
      return { role, content: content.slice(0, 700), risk, time };
    })
    .filter((turn): turn is ChatTurn => Boolean(turn));
}

function trimMemory(turns: ChatTurn[]) {
  return turns.slice(-10);
}

function hasCjk(text: string) {
  return /[\u3400-\u9fff]/.test(text);
}

function speechLang(language: LanguageMode, text = "") {
  if (language === "yue" || hasCjk(text)) return "zh-HK";
  return "en-HK";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read the image.")));
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the image."));
    image.src = src;
  });
}

async function prepareImageDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Attach an image file: JPEG, PNG, WEBP, or a phone photo.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return readFileAsDataUrl(file);

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return readFileAsDataUrl(file);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function LiveSafetyDemo() {
  const [language, setLanguage] = useState<LanguageMode>("yue");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceReply, setVoiceReply] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [memoryTurns, setMemoryTurns] = useState<ChatTurn[]>([]);
  const [memoryReady, setMemoryReady] = useState(false);
  const recognitionRef = useRef<any>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MEMORY_STORAGE_KEY);
      if (saved) setMemoryTurns(normalizeSavedMemory(JSON.parse(saved)));
    } catch {
      setMemoryTurns([]);
    } finally {
      setMemoryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!memoryReady) return;
    window.localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(trimMemory(memoryTurns)));
  }, [memoryReady, memoryTurns]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      window.speechSynthesis?.cancel();
      recognitionRef.current?.abort?.();
    };
  }, [photoPreview]);

  async function askHerald(nextQuestion = question, nextLanguage = language) {
    const trimmed = nextQuestion.trim();
    if (!trimmed && !photoDataUrl) return;

    window.speechSynthesis?.cancel();
    setQuestion(trimmed);
    setLanguage(nextLanguage);
    setLoading(true);
    setError(null);

    try {
      const history = memoryTurns.slice(-8).map(({ role, content, risk }) => ({ role, content, risk }));
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          language: nextLanguage,
          imageDataUrl: photoDataUrl,
          history,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Herald could not answer.");
      setResult(payload);
      const time = new Date().toISOString();
      setMemoryTurns((turns) =>
        trimMemory([
          ...turns,
          {
            role: "worker",
            content: trimmed || "[site photo attached]",
            time,
          },
          {
            role: "herald",
            content: payload.answer,
            risk: payload.risk,
            time,
          },
        ]),
      );
      setQuestion("");
      if (voiceReply) speak(payload.answer, payload.language === "yue" ? "yue" : nextLanguage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Herald could not answer.");
    } finally {
      setLoading(false);
    }
  }

  function speak(text = result?.answer ?? "", langMode = language) {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang(langMode, text);
    utterance.rate = 0.92;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input is not available in this browser. Type the question instead.");
      return;
    }

    window.speechSynthesis?.cancel();
    recognitionRef.current?.abort?.();

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = speechLang(language);

    recognition.onstart = () => {
      setError(null);
      setListening(true);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError("Could not hear clearly. Try again or type the question.");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setQuestion(transcript);
        void askHerald(transcript, language);
      }
    };
    recognition.start();
  }

  async function handlePhoto(file: File | undefined) {
    if (!file) return;

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setPhotoName(file.name);
    setPhotoDataUrl(null);
    setPhotoProcessing(true);
    setError(null);

    try {
      setPhotoDataUrl(await prepareImageDataUrl(file));
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      setError(err instanceof Error ? err.message : "Could not read the photo. Try another image.");
      setPhotoPreview(null);
      setPhotoDataUrl(null);
      setPhotoName(null);
      if (photoInputRef.current) photoInputRef.current.value = "";
    } finally {
      setPhotoProcessing(false);
    }
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoDataUrl(null);
    setPhotoName(null);
    setPhotoProcessing(false);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function clearMemory() {
    setMemoryTurns([]);
    window.localStorage.removeItem(MEMORY_STORAGE_KEY);
  }

  const risk = result?.risk;
  const RiskIcon = risk ? riskIcon[risk] : ShieldCheck;
  const sourceMode =
    result?.mode === "aicoo-votee-source-pack"
      ? "Aicoo reasoning + Votee source pack"
      : result?.mode === "pollinations-votee-source-pack"
        ? "Free LLM + Votee source pack"
        : result?.mode === "safety-fallback-votee-source-pack"
          ? "Safety fallback + Votee source pack"
          : "Free LLM reasoning";

  return (
    <section id="live-demo" className="flex flex-1 flex-col gap-3 pb-4">
      <div className="panel-lift flex flex-1 flex-col overflow-hidden rounded-[1.5rem]">
        <div className="border-b border-[var(--border)] bg-[var(--panel)] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow">Worker console</div>
              <h1 className="h-display mt-1 text-[30px] leading-none sm:text-4xl">Ask before acting.</h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                Speak or type in Cantonese or English. Herald asks for missing context before deciding.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVoiceReply((value) => !value)}
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
                voiceReply
                  ? "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]"
                  : "border-[var(--border)] bg-[var(--muted)] text-muted-foreground"
              }`}
              style={{ width: 44, height: 44, minWidth: 44 }}
              aria-label={voiceReply ? "Voice response on" : "Voice response off"}
              title={voiceReply ? "Voice response on" : "Voice response off"}
            >
              {voiceReply ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-1 rounded-full border border-[var(--border)] bg-[var(--muted)]/70 p-1">
            {[
              ["yue", "粵語"],
              ["en", "English"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setLanguage(value as LanguageMode)}
                className={`min-h-10 rounded-full text-[13px] font-medium transition ${
                  language === value ? "bg-[var(--panel)] text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label htmlFor="worker-question" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Worker question
            </label>
            <textarea
              id="worker-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={
                language === "yue"
                  ? "講低你喺邊度、做緊咩、見到咩危險..."
                  : "Describe where you are, what you are doing, and what looks unsafe..."
              }
              className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--muted)]/50 p-4 text-[16px] leading-relaxed outline-none transition focus:border-[var(--border-strong)]"
            />
          </div>

          {photoPreview && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/50 p-2">
              <img src={photoPreview} alt="Attached site condition" className="h-14 w-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  {photoProcessing ? "Preparing photo" : "Site photo attached"}
                </div>
                <div className="truncate text-[11.5px] text-muted-foreground">
                  {photoProcessing ? "Resizing for recognition..." : photoName}
                </div>
              </div>
              <button
                type="button"
                onClick={clearPhoto}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel)]"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-3 grid grid-cols-[1fr_1fr_1.35fr] gap-2">
            <button
              type="button"
              onClick={startVoice}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border text-[13px] font-medium transition ${
                listening
                  ? "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]"
                  : "border-[var(--border)] bg-[var(--panel)] text-foreground"
              }`}
            >
              <Mic className="h-4 w-4" />
              {listening ? "Listening" : "Speak"}
            </button>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] text-[13px] font-medium text-foreground"
            >
              <Camera className="h-4 w-4" />
              Photo
            </button>
            <button
              type="button"
              onClick={() => askHerald()}
              disabled={loading || photoProcessing || (!question.trim() && !photoDataUrl)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-4 text-[13px] font-medium text-[var(--primary-foreground)] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Checking..." : photoProcessing ? "Preparing..." : "Check"}
              <Send className="h-4 w-4" />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handlePhoto(event.target.files?.[0])}
            />
          </div>

          {error && (
            <div className="mt-3 rounded-2xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 p-3 text-[13px] text-[var(--danger)]">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-[var(--muted)]/35 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-[12px] font-semibold tracking-wider ${
                risk ? riskStyles[risk] : "border-[var(--border)] bg-[var(--panel)] text-muted-foreground"
              }`}
            >
              <RiskIcon className="h-4 w-4" />
              {risk ?? "READY"}
            </div>
            <div className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-[11.5px] font-medium text-muted-foreground">
              {result ? `${result.latencyMs}ms · ${sourceMode}` : sourceMode}
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Herald answer
              </div>
              <button
                type="button"
                onClick={() => speak()}
                disabled={!result?.answer}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--muted)]/50 px-3 text-[12px] font-medium text-foreground disabled:opacity-40"
              >
                <Volume2 className="h-3.5 w-3.5" />
                Play
              </button>
            </div>
            <p className="mt-3 text-[17px] font-medium leading-relaxed text-foreground">
              {result?.answer ?? "Ask a question to get a STOP, CHECK, OK, or context request with cited sources."}
            </p>
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/50 p-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Why this decision
              </div>
              <ol className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {(result?.reasoning ?? [
                  "Herald sends the worker question and photo to a hosted free LLM.",
                  "The model reasons over the Votee safety source pack before deciding.",
                ])
                  .slice(0, 3)
                  .map((step) => (
                    <li key={step}>{step}</li>
                  ))}
              </ol>
            </div>
            {result?.observedText && (
              <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/50 p-3">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Photo / OCR read
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{result.observedText}</p>
              </div>
            )}
          </div>

          <div className="mt-3 grid gap-3">
            <InfoCard icon={<RefreshCcw className="h-4 w-4 text-[var(--gold)]" />} title="Session memory">
              <div className="space-y-2">
                {memoryTurns.length ? (
                  memoryTurns.slice(-6).map((turn, index) => (
                    <div key={`${turn.time}-${index}`} className="grid gap-1 rounded-xl bg-[var(--muted)]/50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        <span>{turn.role === "worker" ? "Worker" : "Herald"}</span>
                        {turn.risk && <span className="text-foreground">{turn.risk}</span>}
                      </div>
                      <p className="line-clamp-2 text-[12.5px] leading-relaxed text-foreground/80">{turn.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[13px] text-muted-foreground">No follow-up context yet.</p>
                )}
                {memoryTurns.length > 0 && (
                  <button
                    type="button"
                    onClick={clearMemory}
                    className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 text-[12px] font-medium text-foreground"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                )}
              </div>
            </InfoCard>

            <InfoCard icon={<ClipboardList className="h-4 w-4 text-[var(--gold)]" />} title="Next steps">
              <ol className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
                {(result?.steps ?? [
                  "Describe the task, location, and visible hazard.",
                  "Attach a photo if text, labels, panels, or site conditions matter.",
                  "If context is missing, the model should ask before deciding.",
                ]).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </InfoCard>

            <InfoCard icon={<RadioTower className="h-4 w-4 text-[var(--danger)]" />} title="Supervisor">
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {result?.supervisor?.message ?? "High-risk answers will notify the responsible supervisor."}
              </p>
            </InfoCard>

            <InfoCard icon={<ShieldCheck className="h-4 w-4 text-foreground/70" />} title="Decision rationale">
              <ol className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
                {(result?.reasoning ?? [
                  "Herald sends text plus any photo to a hosted free LLM.",
                  "The prompt includes the Votee source pack as cited safety memory.",
                  "The model returns STOP, CHECK, OK, or ASK with reasoning and citations.",
                ]).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </InfoCard>

            <InfoCard icon={<BookOpenCheck className="h-4 w-4 text-[var(--gold)]" />} title="Source citations">
              <div className="grid gap-2">
                {(result?.citations ?? []).length ? (
                  result!.citations.map((citation) => (
                    <div key={`${citation.title}-${citation.source}`} className="rounded-xl bg-[var(--muted)]/60 p-3">
                      <div className="text-[13px] font-medium text-foreground">{citation.title}</div>
                      <div className="mt-0.5 text-[11px] font-medium text-[var(--gold)]">{citation.source}</div>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{citation.excerpt}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[13px] text-muted-foreground">Citations appear after Herald answers.</p>
                )}
              </div>
            </InfoCard>

            <InfoCard icon={<ClipboardList className="h-4 w-4 text-foreground/70" />} title="Compliance log">
              <div className="space-y-1.5 font-mono text-[11.5px] text-foreground/75">
                {(result?.logs ?? []).slice(0, 4).map((log) => (
                  <div key={log.id} className="flex items-center justify-between gap-3 rounded-lg bg-[var(--muted)]/50 px-2 py-1.5">
                    <span>
                      {log.risk} / {log.ruleId}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(log.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
                {!result?.logs?.length && <span className="text-muted-foreground">No log entries yet.</span>}
              </div>
            </InfoCard>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
      <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
