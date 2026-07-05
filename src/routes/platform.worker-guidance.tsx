import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader, CTAStrip } from "@/components/page-shell";
import { WorkerGuidanceMock } from "@/components/product-mocks";

export const Route = createFileRoute("/platform/worker-guidance")({
  head: () => ({
    meta: [
      { title: "Worker Guidance — Sifu" },
      {
        name: "description",
        content:
          "Cantonese-first, sub-2s worker guidance with STOP/CHECK safety routing before risky actions on site.",
      },
      { property: "og:title", content: "Worker Guidance — Sifu" },
      {
        property: "og:description",
        content: "Ask before acting. STOP/CHECK routing for the frontline.",
      },
    ],
  }),
  component: WorkerGuidance,
});

function WorkerGuidance() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Worker Guidance"
        title="Ask in your language. Before you act."
        lead="Sifu sits on the worker's phone or shared site tablet. Cantonese-first. Conservative on danger. Under 2s target response so the answer arrives while the tool is still in hand."
      />
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <WorkerGuidanceMock />
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              t: "Natural-language questions",
              d: "Workers speak the way they speak on site — Cantonese, English, and jargon. Sifu parses code-switching without correction.",
            },
            {
              t: "STOP / CHECK / OK routing",
              d: "Every question is classified. Dangerous actions get STOP with a cited reason. Ambiguous ones get CHECK and a supervisor ping.",
            },
            {
              t: "Human fallback",
              d: "If Sifu isn't confident, it doesn't guess. The question is routed to the on-shift supervisor with the full context.",
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
