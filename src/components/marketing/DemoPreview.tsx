/** A real rendering of the parent dashboard with illustrative data — not a screenshot, not a mock-up image. */
export function DemoPreview() {
  const bar = (p: number, tone: string) => (
    <div className="h-2 rounded-full bg-warm-2 overflow-hidden"><div className={`h-full rounded-full ${tone}`} style={{ width: `${p}%` }} /></div>
  );
  return (
    <div className="border border-line rounded-lg overflow-hidden bg-paper shadow-[var(--shadow-soft)]" aria-label="Preview of the Planned parent dashboard">
      <div className="h-10 border-b border-line bg-warm flex items-center px-4 gap-2 text-[12.5px] text-ink-3">
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" /><span className="h-2.5 w-2.5 rounded-full bg-line-strong" /><span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="ml-3">planned.app / The Kato family</span>
      </div>
      <div className="grid lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block border-r border-line p-4 text-[14px] text-ink-2 space-y-1">
          {["Overview", "Children", "Approvals", "Allowances", "Goals", "Transactions", "Reports", "Settings"].map((n, i) => (
            <div key={n} className={`px-3 py-1.5 rounded-md ${i === 0 ? "bg-brand-soft text-brand font-medium" : ""}`}>{n}{n === "Approvals" && <span className="ml-2 inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-goal-soft text-goal text-[12px] font-medium">2</span>}</div>
          ))}
        </aside>
        <div className="p-6 sm:p-8">
          <p className="text-ink-3 text-[14px]">Good afternoon, Sarah</p>
          <h3 className="text-[26px] sm:text-[30px] font-semibold leading-tight mt-1">Your family saved <span className="text-save">UGX 420,000</span> this month.</h3>
          <p className="text-ink-2 mt-1">That&rsquo;s 18% more than last month. Two requests are waiting for you.</p>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div>
              <p className="text-[13px] font-medium text-ink-3 uppercase tracking-wide mb-3">Family progress</p>
              <div className="space-y-4">
                <div><div className="flex justify-between text-[14px] mb-1.5"><span>Daniel · New bicycle</span><span className="tnum text-ink-2">60%</span></div>{bar(60, "bg-save")}</div>
                <div><div className="flex justify-between text-[14px] mb-1.5"><span>Maya · Art supplies</span><span className="tnum text-ink-2">82%</span></div>{bar(82, "bg-save")}</div>
                <div><div className="flex justify-between text-[14px] mb-1.5"><span>Family · Holiday fund</span><span className="tnum text-ink-2">41%</span></div>{bar(41, "bg-brand")}</div>
              </div>
            </div>
            <div>
              <p className="text-[13px] font-medium text-ink-3 uppercase tracking-wide mb-3">What&rsquo;s happening</p>
              <ul className="text-[14.5px] space-y-2.5">
                <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-save shrink-0" />Maya reached 80% of her art supplies goal</li>
                <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-goal shrink-0" />Daniel requested UGX 25,000 for school supplies</li>
                <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />Weekly allowances paid to Daniel and Maya</li>
                <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-grow shrink-0" />Maya finished &ldquo;Money that earns money&rdquo;</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border border-line rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between bg-warm">
            <div><p className="font-medium">Daniel is 60% of the way to his bicycle</p><p className="text-[14px] text-ink-2">At his current pace he&rsquo;ll get there in about 7 weeks. A UGX 30,000 family contribution would make it 5.</p></div>
            <div className="flex gap-2 shrink-0"><span className="h-9 px-3.5 inline-flex items-center rounded-md bg-brand text-white text-[14px] font-medium">Contribute</span><span className="h-9 px-3.5 inline-flex items-center rounded-md border border-line-strong text-[14px] font-medium">Review</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
