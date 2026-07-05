import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader, CTAStrip, Arrow } from "@/components/page-shell";

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: "Platform — Herald" },
      {
        name: "description",
        content:
          "The Herald platform: worker guidance, safety memory built on Votee AI and Beever Atlas, and audit-ready compliance logging.",
      },
      { property: "og:title", content: "Platform — Herald" },
      {
        property: "og:description",
        content: "Worker guidance, safety memory, and compliance logging for physical worker teams.",
      },
    ],
  }),
  component: Platform,
});

const surfaces = [
  {
    to: "/platform/worker-guidance",
    n: "01",
    t: "Worker Guidance",
    d: "Natural-language questions before risky actions. STOP/CHECK routing, Cantonese-first, sub-2s target response.",
  },
  {
    to: "/platform/safety-memory",
    n: "02",
    t: "Safety Memory",
    d: "Votee AI + Beever Atlas retrieval over site SOPs, regulator codes, permits and worker Q&A. Every answer cited.",
  },
  {
    to: "/platform/compliance-logging",
    n: "03",
    t: "Compliance Logging",
    d: "Supervisor escalation, immutable event log, exportable audit trail for inspectors and clients.",
  },
];

function Platform() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Platform"
        title="Three surfaces. One safety operating layer."
        lead="Herald is deployed as a coordinated system across the site: what the worker sees, what the memory retrieves, and what the compliance layer records."
      />
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-5 md:grid-cols-3">
          {surfaces.map((s) => (
            <Link
              key={s.t}
              to={s.to}
              className="panel group flex flex-col rounded-2xl p-7 transition hover:border-[var(--border-strong)]"
            >
              <div className="font-mono text-[11px] tracking-wider text-[var(--gold)]">{s.n}</div>
              <h2 className="mt-3 text-[20px] font-semibold">{s.t}</h2>
              <p className="mt-3 flex-1 text-[14px] leading-relaxed text-muted-foreground">{s.d}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium">
                Explore <Arrow />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <CTAStrip />
    </PageShell>
  );
}
