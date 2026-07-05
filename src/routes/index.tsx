import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, CTAStrip, Arrow } from "@/components/page-shell";
import {
  WorkerGuidanceMock,
  SafetyMemoryMock,
  ComplianceLogMock,
  DecisionPill,
  SourceChip,
} from "@/components/product-mocks";

export const Route = createFileRoute("/")({
  component: Home,
});

const partners = [
  "Construction GCs",
  "Facilities Management",
  "Site Safety Officers",
  "Operations & QA",
  "Fire Services Compliance",
  "MEP Contractors",
];

const capabilities = [
  {
    to: "/platform/worker-guidance",
    title: "Worker Guidance",
    lead:
      "Workers ask in natural Cantonese or English before acting. Herald returns a fast, cited answer — with STOP or CHECK when the risk is real.",
    bullets: ["Cantonese-first", "Under 2s target response", "Conservative on high-risk actions"],
  },
  {
    to: "/platform/safety-memory",
    title: "Safety Memory",
    lead:
      "Powered by Votee AI and Beever Atlas. Site SOPs, regulator codes, permit templates, and worker Q&A become one cited memory layer.",
    bullets: ["Source-pack citations", "Live worker knowledge capture", "Revision-aware"],
  },
  {
    to: "/platform/compliance-logging",
    title: "Compliance Logging",
    lead:
      "Every question, decision, and escalation is written to an audit-ready log. Supervisors see the risk queue in real time.",
    bullets: ["Supervisor escalation", "Immutable event log", "Exportable audit trail"],
  },
];

const metrics = [
  { k: "< 2s", v: "Target response time on site" },
  { k: "STOP / CHECK", v: "Safety-critical decision routing" },
  { k: "100%", v: "Answers cite a source pack" },
  { k: "1-tap", v: "Supervisor escalation & log" },
];

const whyHerald = [
  {
    t: "Built for physical workers",
    d: "Not office staff. Herald is designed for helmets, gloves, poor light, and one-handed use on scaffolding.",
  },
  {
    t: "Cantonese-first site language",
    d: "Workers ask the way they actually speak. Herald handles code-switching between Cantonese, English, and site jargon.",
  },
  {
    t: "Conservative on danger",
    d: "For high-risk actions — hot work, isolation, confined space — Herald defaults to STOP and routes to a human.",
  },
  {
    t: "Human fallback, always",
    d: "When Herald isn't sure, it doesn't guess. The question is escalated to the supervisor with full context.",
  },
];

const resources = [
  { tag: "Brief", t: "Site safety AI, without the hallucinations", d: "How Herald routes STOP, CHECK, and OK decisions." },
  { tag: "Architecture", t: "Votee AI + Beever Atlas as safety memory", d: "The retrieval layer under every cited answer." },
  { tag: "Playbook", t: "Capturing frontline worker knowledge", d: "Turning site-floor Q&A into your memory layer." },
];

function Home() {
  return (
    <PageShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 pt-16 pb-20 md:pt-24 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--panel)] px-3 py-1 text-[12px] text-foreground/75">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
              Hong Kong · Built on Votee AI · Beever Atlas
            </div>
            <h1 className="h-display mt-5 text-[44px] leading-[1.02] md:text-[64px]">
              AI guidance for the workers making the{" "}
              <span className="text-[var(--danger)]">dangerous calls.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
              Herald helps frontline workers ask safety-critical questions before acting. Fast, cited
              answers. STOP/CHECK routing on high-risk decisions. Supervisor escalation. An audit-ready
              compliance trail — automatically.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[14px] font-medium text-[var(--primary-foreground)]"
              >
                Book a Demo <Arrow />
              </a>
              <Link
                to="/platform"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--panel)] px-5 py-2.5 text-[14px] font-medium"
              >
                View Platform <Arrow />
              </Link>
            </div>

            {/* micro-proof */}
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-[var(--border)] pt-6">
              {[
                { k: "1.4s", v: "median response" },
                { k: "12", v: "site source packs" },
                { k: "0", v: "unsourced answers" },
              ].map((m) => (
                <div key={m.v}>
                  <div className="font-mono text-[20px] font-medium text-foreground">{m.k}</div>
                  <div className="text-[12px] text-muted-foreground">{m.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero mock */}
          <div className="lg:pt-4">
            <WorkerGuidanceMock />
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-[var(--border)] bg-[var(--panel)]/60">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Evaluated by teams at
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              {partners.map((p) => (
                <span key={p} className="text-[13px] font-medium text-foreground/75">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-10 md:grid-cols-[1fr_1.6fr]">
          <div>
            <div className="eyebrow">The Platform</div>
            <h2 className="h-display mt-3 text-4xl">
              An operating layer for site safety, not a chatbot.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
              Three surfaces work together — worker-facing guidance, a cited safety memory built on
              Votee AI and Beever Atlas, and a supervisor-visible compliance log.
            </p>
          </div>
          <div className="grid gap-4">
            {capabilities.map((c, i) => (
              <Link
                key={c.title}
                to={c.to}
                className="panel group flex items-start gap-5 rounded-2xl p-6 transition hover:border-[var(--border-strong)]"
              >
                <div className="mt-1 font-mono text-[11px] tracking-wider text-muted-foreground">
                  0{i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[18px] font-semibold text-foreground">{c.title}</h3>
                    <span className="text-muted-foreground transition group-hover:translate-x-0.5">
                      <Arrow />
                    </span>
                  </div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{c.lead}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.bullets.map((b) => (
                      <span
                        key={b}
                        className="rounded-md border border-[var(--border)] bg-[var(--muted)]/60 px-2 py-0.5 text-[11.5px] text-foreground/70"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF METRICS + LIVE LOG */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="eyebrow">Proof</div>
            <h2 className="h-display mt-3 text-4xl">Outcomes safety officers can defend.</h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Herald is built so every answer is fast enough to trust on site, cited from a real
              source, and logged for the inspector.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)]">
              {metrics.map((m) => (
                <div key={m.v} className="bg-[var(--panel)] p-5">
                  <div className="h-display text-[26px] text-foreground">{m.k}</div>
                  <div className="mt-1 text-[12.5px] text-muted-foreground">{m.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <ComplianceLogMock />
          </div>
        </div>
      </section>

      {/* WHY HERALD */}
      <section className="bg-[var(--panel)] border-y border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="flex items-end justify-between">
            <div>
              <div className="eyebrow">Why Herald</div>
              <h2 className="h-display mt-3 max-w-2xl text-4xl">
                Serious enough for the site. Quiet enough to be trusted.
              </h2>
            </div>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-2">
            {whyHerald.map((w, i) => (
              <div key={w.t} className="bg-[var(--panel)] p-7">
                <div className="font-mono text-[11px] tracking-wider text-[var(--gold)]">
                  0{i + 1}
                </div>
                <h3 className="mt-3 text-[18px] font-semibold">{w.t}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAFETY MEMORY DEEP CUT */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <SafetyMemoryMock />
          </div>
          <div>
            <div className="eyebrow">Safety Memory · Votee AI · Beever Atlas</div>
            <h2 className="h-display mt-3 text-4xl">
              The retrieval layer under every answer.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
              Herald doesn't guess. Site SOPs, regulator codes, permit templates and captured worker
              Q&A live inside a Beever Atlas memory served by Votee AI. Every response cites the
              exact source pack, clause, and revision — so supervisors can defend the decision.
            </p>
            <ul className="mt-6 space-y-3 text-[14.5px]">
              {[
                "Ingest site SOPs, method statements, permits",
                "Capture worker Q&A from the floor",
                "Version-aware — old clauses get retired",
                "Cited answers, never black-box generations",
              ].map((li) => (
                <li key={li} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span className="text-foreground/85">{li}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-1.5">
              <SourceChip label="Beever Atlas" gold />
              <SourceChip label="Votee AI" gold />
              <SourceChip label="FSD CoP 2022" />
              <SourceChip label="Site SOP B7-014" />
            </div>
          </div>
        </div>
      </section>

      {/* REGION */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="panel-lift overflow-hidden rounded-3xl">
          <div className="grid gap-10 p-10 lg:grid-cols-[1.2fr_1fr] lg:p-14">
            <div>
              <div className="eyebrow">Regions</div>
              <h2 className="h-display mt-3 text-4xl">
                Hong Kong first. Built for dense sites.
              </h2>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Herald is deployed in Hong Kong construction and facilities environments — where
                density, code compliance, and Cantonese-first frontline teams make site safety
                unforgiving. Expandable to the Greater Bay Area and global physical-worker markets.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  { l: "Hong Kong SAR", live: true },
                  { l: "Greater Bay Area", live: false },
                  { l: "Singapore", live: false },
                  { l: "Middle East", live: false },
                ].map((r) => (
                  <span
                    key={r.l}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--panel)] px-3 py-1 text-[12.5px]"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        r.live ? "bg-emerald-600" : "bg-foreground/25"
                      }`}
                    />
                    {r.l}
                    <span className="text-muted-foreground">
                      · {r.live ? "Live" : "Roadmap"}
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/50 p-6">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Today · Site B7 · Kowloon
              </div>
              <div className="mt-3 space-y-3">
                {[
                  { t: "Questions answered", v: "1,284" },
                  { t: "STOP decisions", v: "18" },
                  { t: "Supervisor escalations", v: "42" },
                  { t: "Median latency", v: "1.4s" },
                ].map((row) => (
                  <div
                    key={row.t}
                    className="flex items-center justify-between border-b border-[var(--border)] pb-2 text-[13.5px] last:border-b-0"
                  >
                    <span className="text-muted-foreground">{row.t}</span>
                    <span className="font-mono text-foreground">{row.v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <DecisionPill tone="danger" label="STOP" />
                <DecisionPill tone="gold" label="CHECK" />
                <DecisionPill tone="ok" label="OK" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESOURCES */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="flex items-end justify-between">
          <div>
            <div className="eyebrow">Latest</div>
            <h2 className="h-display mt-3 text-4xl">Notes from the site floor.</h2>
          </div>
          <Link
            to="/resources"
            className="hidden items-center gap-1.5 text-[13.5px] font-medium text-foreground/80 hover:text-foreground md:inline-flex"
          >
            All resources <Arrow />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {resources.map((r) => (
            <Link
              key={r.t}
              to="/resources"
              className="panel group flex flex-col rounded-2xl p-6 transition hover:border-[var(--border-strong)]"
            >
              <div className="eyebrow">{r.tag}</div>
              <h3 className="mt-3 text-[17px] font-semibold leading-snug">{r.t}</h3>
              <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-muted-foreground">{r.d}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground/80 transition group-hover:text-foreground">
                Read <Arrow />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <CTAStrip />
    </PageShell>
  );
}
