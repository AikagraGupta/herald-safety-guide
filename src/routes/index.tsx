import { createFileRoute } from "@tanstack/react-router";
import { LiveSafetyDemo } from "@/components/live-safety-demo";
import { SifuMark } from "@/components/site-header";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 py-3 sm:px-5 sm:py-5">
        <header className="mb-3 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--panel)_92%,transparent)] px-3 py-2 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2.5">
            <SifuMark />
            <div className="min-w-0">
              <div className="text-[15px] font-semibold leading-tight text-foreground">Sifu</div>
              <div className="truncate text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                AI for Physical Workers
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--panel)] px-2.5 py-1 text-[11px] font-medium text-foreground/75">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Votee ready
          </div>
        </header>

        <LiveSafetyDemo />
      </div>
    </main>
  );
}
