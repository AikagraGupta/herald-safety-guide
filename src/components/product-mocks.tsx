// Product UI mockup fragments used across the site.
// These are visual representations of Sifu's operating surfaces, not wired-up components.

export function WorkerGuidanceMock() {
  return (
    <div className="panel-lift w-full overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--muted)]/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--danger)]/60" />
          <span className="h-2 w-2 rounded-full bg-[var(--gold)]/60" />
          <span className="h-2 w-2 rounded-full bg-foreground/20" />
          <span className="ml-3 text-[11px] font-medium tracking-wider text-muted-foreground">
            SIFU · WORKER VIEW · SITE B7-03
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Online · 1.4s
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.05fr_1fr]">
        <div className="border-b border-[var(--border)] p-5 md:border-b-0 md:border-r">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Worker</div>
              <div className="text-[13.5px] font-medium">Chan Ka Ho · Site team · Lvl 3</div>
            </div>
            <div className="text-[11px] text-muted-foreground">粵語 · Cantonese</div>
          </div>

          <div className="mb-3 rounded-2xl rounded-tl-md bg-[var(--muted)] p-3.5">
            <div className="text-[11px] text-muted-foreground">14:22 · Q1</div>
            <div className="mt-1 text-[14px] leading-relaxed text-foreground">
              我喺三樓走廊見到地上有水漬，推車可唔可以行過去？
              <div className="mt-1 text-[12.5px] text-muted-foreground">
                “There is water on the 3/F corridor. Can I push the cart through?”
              </div>
            </div>
          </div>

          <div className="rounded-2xl rounded-tr-md border border-[var(--gold)]/25 bg-[var(--panel)] p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold)]/10 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-[var(--gold)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> CHECK
              </span>
              <span className="text-[11px] text-muted-foreground">Access hazard · Supervisor recommended</span>
            </div>
            <div className="mt-2.5 text-[14px] leading-relaxed">
              Control the path before moving the cart. Mark the wet area, keep workers away from the route, and
              continue only after the floor is dry or a safe alternate path is confirmed.
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <SourceChip label="Housekeeping SOP §2.1" />
              <SourceChip label="Access control · Wet floor" gold />
              <SourceChip label="Site rule HK-21" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button className="rounded-full bg-[var(--primary)] px-3 py-1.5 text-[12px] font-medium text-[var(--primary-foreground)]">
                Mark area
              </button>
              <button className="rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-[12px] font-medium">
                Ask supervisor
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[var(--muted)]/40 p-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Escalation</div>
          <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3.5">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-medium">Wong Siu Ming · Safety Officer</div>
              <span className="text-[11px] text-muted-foreground">14:22:04</span>
            </div>
            <div className="mt-1 text-[12.5px] text-muted-foreground">
              Notified · Wet access route near 3/F corridor
            </div>
            <div className="mt-2.5 flex gap-1.5">
              <span className="rounded-md bg-emerald-600/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Acknowledge
              </span>
              <span className="rounded-md bg-[var(--danger)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--danger)]">
                Block route
              </span>
              <span className="rounded-md bg-[var(--gold)]/15 px-2 py-0.5 text-[11px] font-medium text-[var(--gold)]">
                Clear path
              </span>
            </div>
          </div>

          <div className="mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">
            Compliance log · auto-written
          </div>
          <div className="mt-2 space-y-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3.5 font-mono text-[11.5px] leading-relaxed text-foreground/80">
            <div>
              <span className="text-muted-foreground">14:22:01</span> worker.query slip_trip.access
            </div>
            <div>
              <span className="text-muted-foreground">14:22:02</span> sifu.decision{" "}
              <span className="text-[var(--gold)]">CHECK</span>
            </div>
            <div>
              <span className="text-muted-foreground">14:22:02</span> memory.cite SOP:HK-21§2.1
            </div>
            <div>
              <span className="text-muted-foreground">14:22:03</span> escalate sup:WSM-041
            </div>
            <div>
              <span className="text-muted-foreground">14:22:04</span> audit.append evt#A-91240
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SourceChip({ label, gold = false }: { label: string; gold?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
        gold
          ? "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]"
          : "border-[var(--border-strong)] bg-[var(--muted)] text-foreground/75"
      }`}
    >
      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
        <path d="M2 1.5h4L8 3.5v5H2v-7Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
      {label}
    </span>
  );
}

export function SafetyMemoryMock() {
  const packs = [
    { name: "Site SOP · B7 Tower", count: 214, freshness: "Updated 2d ago", tag: "Beever Atlas" },
    { name: "Access and housekeeping", count: 96, freshness: "Verified 11d ago", tag: "Site Ops" },
    { name: "Worker Q&A · Field hazards", count: 1_284, freshness: "Live capture", tag: "Votee AI" },
    { name: "Permit-to-Work Templates", count: 42, freshness: "Signed by SO", tag: "Safety" },
  ];
  return (
    <div className="panel-lift overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
        <div className="text-[11px] font-medium tracking-wider text-muted-foreground">
          SAFETY MEMORY · SOURCE PACKS
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
          Powered by Votee AI · Beever Atlas
        </div>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {packs.map((p) => (
          <div key={p.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3">
            <div>
              <div className="text-[13.5px] font-medium">{p.name}</div>
              <div className="text-[11.5px] text-muted-foreground">{p.freshness}</div>
            </div>
            <div className="text-right font-mono text-[12px] text-foreground/70">
              {p.count.toLocaleString()} <span className="text-muted-foreground">chunks</span>
            </div>
            <SourceChip label={p.tag} gold={p.tag !== "Site Ops"} />
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--border)] bg-[var(--muted)]/40 px-4 py-2.5 text-[11.5px] text-muted-foreground">
        Every Sifu answer cites the exact source pack, clause, and revision.
      </div>
    </div>
  );
}

export function ComplianceLogMock() {
  const rows = [
    { t: "14:22", w: "Chan K.H.", q: "Wet access route 3/F", d: "CHECK", tone: "gold" },
    { t: "13:41", w: "Lee W.C.", q: "Hot work near LPG tank", d: "CHECK", tone: "gold" },
    { t: "12:08", w: "Ng S.L.", q: "Ladder above 3m alone", d: "STOP", tone: "danger" },
    { t: "11:55", w: "Cheung Y.", q: "Torque for M16 bolt", d: "OK", tone: "ok" },
    { t: "10:34", w: "Ho K.M.", q: "Confined space entry", d: "CHECK", tone: "gold" },
  ] as const;
  return (
    <div className="panel-lift overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
        <div className="text-[11px] font-medium tracking-wider text-muted-foreground">
          COMPLIANCE LOG · SITE B7 · TODAY
        </div>
        <div className="text-[11px] text-muted-foreground">Audit-ready · exportable</div>
      </div>
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2 font-medium">Time</th>
            <th className="px-4 py-2 font-medium">Worker</th>
            <th className="px-4 py-2 font-medium">Question</th>
            <th className="px-4 py-2 font-medium">Decision</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[var(--border)] last:border-b-0">
              <td className="px-4 py-2.5 font-mono text-[12px] text-muted-foreground">{r.t}</td>
              <td className="px-4 py-2.5">{r.w}</td>
              <td className="px-4 py-2.5 text-foreground/85">{r.q}</td>
              <td className="px-4 py-2.5">
                <DecisionPill tone={r.tone} label={r.d} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DecisionPill({ tone, label }: { tone: "danger" | "gold" | "ok"; label: string }) {
  const map = {
    danger: "bg-[var(--danger)]/10 text-[var(--danger)] ring-[var(--danger)]/20",
    gold: "bg-[var(--gold)]/12 text-[var(--gold)] ring-[var(--gold)]/25",
    ok: "bg-emerald-600/10 text-emerald-700 ring-emerald-600/20",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wider ring-1 ${map[tone]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          tone === "danger" ? "bg-[var(--danger)]" : tone === "gold" ? "bg-[var(--gold)]" : "bg-emerald-600"
        }`}
      />
      {label}
    </span>
  );
}
