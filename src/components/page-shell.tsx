import { Link } from "@tanstack/react-router";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-16 pb-10 md:pt-24">
      <div className="max-w-3xl">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="h-display mt-3 text-4xl md:text-5xl">{title}</h1>
        {lead && (
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">{lead}</p>
        )}
      </div>
    </section>
  );
}

export function CTAStrip() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div
        className="panel-lift overflow-hidden rounded-3xl"
        style={{ backgroundColor: "var(--primary)" }}
      >
        <div className="grid gap-8 p-10 md:grid-cols-[1.4fr_1fr] md:p-14">
          <div className="text-[var(--primary-foreground)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              Hackathon demo
            </div>
            <h2 className="h-display mt-3 text-3xl md:text-4xl">
              Give every worker an expert in their ear.
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[color-mix(in_oklab,var(--primary-foreground)_75%,transparent)]">
              Run the fire-alarm scenario live. Sifu blocks the action, cites the Votee source pack,
              notifies the supervisor, and writes the compliance log.
            </p>
          </div>
          <div className="flex flex-col items-start justify-center gap-3 md:items-end">
            <a
              href="#live-demo"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-2.5 text-[14px] font-medium text-[var(--gold-foreground)]"
            >
              Run Live Demo
              <Arrow />
            </a>
            <Link
              to="/platform"
              className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--primary-foreground)_25%,transparent)] px-5 py-2.5 text-[14px] font-medium text-[var(--primary-foreground)]"
            >
              View Platform
              <Arrow />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Arrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 6h7M6 2.5 9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
