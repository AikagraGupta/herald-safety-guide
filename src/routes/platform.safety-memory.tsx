import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader, CTAStrip } from "@/components/page-shell";
import { SafetyMemoryMock, SourceChip } from "@/components/product-mocks";

export const Route = createFileRoute("/platform/safety-memory")({
  head: () => ({
    meta: [
      { title: "Safety Memory — Herald" },
      {
        name: "description",
        content:
          "Site SOPs, regulator codes, permits, and worker Q&A as a cited retrieval layer — built on Votee AI and Beever Atlas.",
      },
      { property: "og:title", content: "Safety Memory — Herald" },
      {
        property: "og:description",
        content: "Cited safety memory built on Votee AI and Beever Atlas.",
      },
    ],
  }),
  component: SafetyMemory,
});

function SafetyMemory() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Safety Memory · Votee AI · Beever Atlas"
        title="The source of truth Herald cites, every time."
        lead="Site SOPs, method statements, regulator codes, permit templates and captured floor Q&A become one revision-aware memory. Every Herald answer cites the pack, the clause, and the version."
      />
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <SafetyMemoryMock />
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              t: "Ingest what your site already runs on",
              d: "SOPs, method statements, permits, drawings, safety bulletins. Herald parses them into structured, versioned source packs.",
            },
            {
              t: "Capture worker knowledge as memory",
              d: "Every question a worker asks — and every answer a supervisor gives — is captured back into the memory layer with attribution.",
            },
            {
              t: "Revision-aware retrieval",
              d: "When a clause is superseded, the old version stops citing. No worker gets guidance from a retired rulebook.",
            },
            {
              t: "Cited, never black-box",
              d: "Herald cannot answer without a source. If no source pack supports the question, the worker sees CHECK and a supervisor is paged.",
            },
          ].map((c) => (
            <div key={c.t} className="panel rounded-2xl p-6">
              <h3 className="text-[16px] font-semibold">{c.t}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-1.5">
          <SourceChip label="Beever Atlas" gold />
          <SourceChip label="Votee AI" gold />
          <SourceChip label="FSD CoP 2022" />
          <SourceChip label="Site SOP B7-014" />
          <SourceChip label="Permit-to-Work · PTW-11" />
        </div>
      </section>
      <CTAStrip />
    </PageShell>
  );
}
