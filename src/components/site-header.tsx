import { Link } from "@tanstack/react-router";
import { useState } from "react";

const navGroups = [
  {
    label: "Platform",
    items: [
      { to: "/platform", label: "Overview" },
      { to: "/platform/worker-guidance", label: "Worker Guidance" },
      { to: "/platform/safety-memory", label: "Safety Memory" },
      { to: "/platform/compliance-logging", label: "Compliance Logging" },
    ],
  },
  {
    label: "Safety Proof",
    items: [
      { to: "/platform/compliance-logging", label: "Audit Trail" },
      { to: "/platform/safety-memory", label: "Cited Answers" },
      { to: "/platform/worker-guidance", label: "STOP/CHECK Routing" },
    ],
  },
  {
    label: "Resources",
    items: [
      { to: "/resources", label: "All Resources" },
      { to: "/resources", label: "Site Safety AI Brief" },
      { to: "/resources", label: "Votee Memory Note" },
    ],
  },
  {
    label: "Company",
    items: [
      { to: "/about", label: "About Herald" },
      { to: "/about", label: "Regions" },
      { to: "/about", label: "Contact" },
    ],
  },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="sticky top-0 z-50 px-4 pt-4">
      <header
        className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-[var(--border)] bg-[color-mix(in_oklab,var(--panel)_92%,transparent)] px-3 py-2 pl-5 backdrop-blur-md"
        style={{ boxShadow: "0 1px 2px rgba(20,39,68,0.04), 0 12px 32px -20px rgba(20,39,68,0.18)" }}
      >
        <Link to="/" className="flex min-h-10 items-center gap-2.5">
          <HeraldMark />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">Herald</span>
          <span className="hidden text-[11px] font-medium tracking-wider text-muted-foreground sm:inline">
            AI FOR PHYSICAL WORKERS
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          onMouseLeave={() => setOpen(null)}
        >
          {navGroups.map((group) => (
            <div key={group.label} className="relative">
              <button
                onMouseEnter={() => setOpen(group.label)}
                onFocus={() => setOpen(group.label)}
                className="rounded-full px-3.5 py-1.5 text-[13.5px] font-medium text-foreground/85 transition hover:text-foreground"
              >
                {group.label}
              </button>
              {open === group.label && (
                <div className="absolute left-1/2 top-full z-10 w-64 -translate-x-1/2 pt-3">
                  <div className="panel-lift overflow-hidden rounded-2xl p-1.5">
                    {group.items.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setOpen(null)}
                        className="block rounded-xl px-3 py-2 text-[13.5px] text-foreground/85 transition hover:bg-[var(--muted)] hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#live-demo"
            className="hidden min-h-10 items-center rounded-full px-3.5 py-2 text-[13.5px] font-medium text-foreground/85 hover:text-foreground sm:inline-flex"
          >
            Try scenario
          </a>
          <a
            href="#live-demo"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-[13.5px] font-medium text-[var(--primary-foreground)] transition hover:opacity-90"
          >
            Run Demo
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M2.5 6h7M6 2.5 9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </header>
    </div>
  );
}

export function HeraldMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] ${className}`}
      aria-hidden
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 2v12M13 2v12M3 8h10M8 2v4M8 10v4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
