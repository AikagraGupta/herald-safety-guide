import { Link } from "@tanstack/react-router";
import { HeraldMark } from "./site-header";

const cols = [
  {
    title: "Platform",
    links: [
      { to: "/platform", label: "Overview" },
      { to: "/platform/worker-guidance", label: "Worker Guidance" },
      { to: "/platform/safety-memory", label: "Safety Memory" },
      { to: "/platform/compliance-logging", label: "Compliance Logging" },
    ],
  },
  {
    title: "Safety Proof",
    links: [
      { to: "/platform/compliance-logging", label: "Audit-ready records" },
      { to: "/platform/safety-memory", label: "Cited source memory" },
      { to: "/platform/worker-guidance", label: "STOP / CHECK routing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { to: "/resources", label: "Site safety AI brief" },
      { to: "/resources", label: "Votee memory architecture" },
      { to: "/resources", label: "Frontline knowledge capture" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About Herald" },
      { to: "/about", label: "Regions" },
      { to: "/about", label: "Careers" },
      { to: "/about", label: "Contact" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer id="contact" className="mt-24 border-t border-[var(--border)] bg-[var(--panel)]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <HeraldMark />
              <span className="text-[15px] font-semibold tracking-tight">Herald</span>
            </Link>
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
              AI guidance for the workers making dangerous calls on site. Built on Votee AI and
              Beever Atlas memory. Hong Kong-first, built for construction and facilities.
            </p>
            <div className="mt-6 space-y-1.5 text-[13px] text-muted-foreground">
              <div>Herald Ops Ltd. · Kwun Tong, Hong Kong</div>
              <div>contact@herald.site</div>
              <div>+852 5000 0000</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {cols.map((col) => (
              <div key={col.title}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/60">
                  {col.title}
                </div>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        className="text-[13.5px] text-foreground/80 transition hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-[var(--border)] pt-6 text-[12.5px] text-muted-foreground sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} Herald. Operating safety, not office chat.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Security</a>
            <a href="#" className="hover:text-foreground">DPA</a>
            <a href="#" className="hover:text-foreground">Status</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
