import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader, CTAStrip, Arrow } from "@/components/page-shell";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources — Herald" },
      {
        name: "description",
        content:
          "Briefs and notes on site safety AI, Votee AI + Beever Atlas memory architecture, and frontline worker knowledge capture.",
      },
      { property: "og:title", content: "Resources — Herald" },
      {
        property: "og:description",
        content: "Site safety AI, Votee memory architecture, and frontline knowledge capture.",
      },
    ],
  }),
  component: Resources,
});

const items = [
  {
    tag: "Brief",
    t: "Site safety AI, without the hallucinations",
    d: "How Herald routes STOP, CHECK, and OK decisions — and why the AI is deliberately conservative on high-risk actions.",
    time: "8 min read",
  },
  {
    tag: "Architecture",
    t: "Votee AI + Beever Atlas as safety memory",
    d: "The retrieval layer under every cited Herald answer. Source packs, revisions, and how citation is enforced.",
    time: "12 min read",
  },
  {
    tag: "Playbook",
    t: "Capturing frontline worker knowledge",
    d: "The tacit knowledge on the site floor rarely reaches the SOP. A method for turning worker Q&A into your memory layer.",
    time: "10 min read",
  },
  {
    tag: "Note",
    t: "Cantonese-first design for site tools",
    d: "Why frontline tools that assume English fail in Hong Kong — and what code-switching UX looks like in practice.",
    time: "6 min read",
  },
  {
    tag: "Field report",
    t: "48 hours on B7 Tower with Herald",
    d: "STOP calls, permit issuance, and how supervisors used the escalation queue during a live site rollout.",
    time: "9 min read",
  },
  {
    tag: "Compliance",
    t: "What inspectors actually want from an audit log",
    d: "The three properties that make an AI-generated audit trail defensible to a regulator or main contractor.",
    time: "7 min read",
  },
];

function Resources() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Resources"
        title="Notes from the site floor and the safety memory."
        lead="Briefs, architecture notes, and field reports from Herald deployments. Written for safety officers, operations leads, and enterprise buyers evaluating AI on the frontline."
      />
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <a
              key={it.t}
              href="#"
              className="panel group flex flex-col rounded-2xl p-6 transition hover:border-[var(--border-strong)]"
            >
              <div className="flex items-center justify-between">
                <div className="eyebrow">{it.tag}</div>
                <div className="text-[11.5px] text-muted-foreground">{it.time}</div>
              </div>
              <h3 className="mt-3 text-[17px] font-semibold leading-snug">{it.t}</h3>
              <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-muted-foreground">{it.d}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium">
                Read <Arrow />
              </span>
            </a>
          ))}
        </div>
      </section>
      <CTAStrip />
    </PageShell>
  );
}
