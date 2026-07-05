import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader, CTAStrip } from "@/components/page-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Sifu" },
      {
        name: "description",
        content:
          "Sifu is an AI safety and guidance platform for physical workers, based in Hong Kong and built on Votee AI and Beever Atlas.",
      },
      { property: "og:title", content: "About — Sifu" },
      {
        property: "og:description",
        content: "Built for physical workers. Hong Kong-first. Powered by Votee AI and Beever Atlas.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Company"
        title="We build for the workers, not the office."
        lead="Sifu was started to close a specific gap: the frontline worker who needs to make a safety-critical call — right now — with the right information. We are Hong Kong-first, built on Votee AI and Beever Atlas, and focused on physical-worker environments."
      />
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              t: "Site-first, not SaaS-first",
              d: "Our product is designed for gloves, dust, poor light, and one-handed operation on scaffolding. The office UI comes second.",
            },
            {
              t: "Cantonese-first language",
              d: "Frontline workers in Hong Kong speak Cantonese. Sifu was built for how they actually ask questions on the floor.",
            },
            {
              t: "Cited, conservative AI",
              d: "We do not ship black-box generations. Every answer cites a real source pack, and dangerous actions default to STOP.",
            },
            {
              t: "Enterprise-ready by default",
              d: "Audit logs, supervisor escalation, and exportable compliance records ship in the base product — not as an add-on.",
            },
          ].map((c) => (
            <div key={c.t} className="panel rounded-2xl p-6">
              <h3 className="text-[16px] font-semibold">{c.t}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>
      <CTAStrip />
    </PageShell>
  );
}
