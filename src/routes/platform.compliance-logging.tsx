import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader, CTAStrip } from "@/components/page-shell";
import { ComplianceLogMock } from "@/components/product-mocks";

export const Route = createFileRoute("/platform/compliance-logging")({
  head: () => ({
    meta: [
      { title: "Compliance Logging — Herald" },
      {
        name: "description",
        content:
          "Supervisor escalation, immutable event log, and exportable audit trail for site safety decisions.",
      },
      { property: "og:title", content: "Compliance Logging — Herald" },
      {
        property: "og:description",
        content: "Audit-ready records of every worker question, decision, and escalation.",
      },
    ],
  }),
  component: Compliance,
});

function Compliance() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Compliance Logging"
        title="An audit trail your inspector will actually accept."
        lead="Every worker question, every Herald decision, every supervisor override — written to an immutable log with cited sources. Exportable per site, per shift, per worker."
      />
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <ComplianceLogMock />
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              t: "Supervisor escalation",
              d: "STOP and CHECK decisions notify the on-shift supervisor with the worker, location, question, cited source, and one-tap actions.",
            },
            {
              t: "Immutable event log",
              d: "Every event — query, retrieval, decision, escalation, override — is appended with a signed timestamp. Nothing is edited retroactively.",
            },
            {
              t: "Export by shift or scope",
              d: "Package audit records per site, per contractor, per worker, per date range for inspectors, main contractors, and insurers.",
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
