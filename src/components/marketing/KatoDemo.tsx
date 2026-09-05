"use client";
import * as React from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button, Progress, Pill, cx } from "@/components/ui";
import { formatMoney, pct } from "@/lib/money";
import { LESSONS } from "@/lib/lessons";
import { weeksToReach } from "@/lib/goals";

const C = "UGX";
type Txn = { id: number; who: string; text: string; amount: number; kind: "allowance" | "spend" | "goal" | "transfer" | "pool"; at: string };
type State = {
  pool: number;
  kids: Record<string, { name: string; age: number; spending: number; savings: number; goals: { id: string; name: string; saved: number; target: number; weekly: number }[]; lessons: number; streak: number }>;
  requests: { id: number; who: string; amount: number; reason: string; status: "pending" | "approved" | "declined" }[];
  txns: Txn[];
  paidPeriods: string[];
  lessonDone: boolean;
};
const initial: State = {
  pool: 620000,
  kids: {
    daniel: { name: "Daniel", age: 12, spending: 34000, savings: 210000, goals: [{ id: "bike", name: "New bicycle", saved: 180000, target: 300000, weekly: 15000 }], lessons: 6, streak: 5 },
    maya: { name: "Maya", age: 9, spending: 12000, savings: 96000, goals: [{ id: "art", name: "Art supplies", saved: 41000, target: 50000, weekly: 8000 }], lessons: 4, streak: 3 },
  },
  requests: [{ id: 1, who: "daniel", amount: 25000, reason: "School supplies for term", status: "pending" }],
  txns: [
    { id: 1, who: "Maya", text: "Weekly allowance → savings", amount: 4000, kind: "allowance", at: "Sat" },
    { id: 2, who: "Maya", text: "Weekly allowance → spending", amount: 16000, kind: "allowance", at: "Sat" },
    { id: 3, who: "Daniel", text: "Saved toward New bicycle", amount: 15000, kind: "goal", at: "Fri" },
    { id: 4, who: "Daniel", text: "School lunch", amount: -5000, kind: "spend", at: "Thu" },
    { id: 5, who: "Sarah", text: "Added to family pool", amount: 300000, kind: "pool", at: "Mon" },
  ],
  paidPeriods: [],
  lessonDone: false,
};
const TABS = ["Family", "Daniel", "Maya", "Approvals", "Transactions", "Lesson"] as const;

export function KatoDemo() {
  const [s, setS] = React.useState<State>(initial);
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("Family");
  const [flash, setFlash] = React.useState<string | null>(null);
  const note = (m: string) => { setFlash(m); setTimeout(() => setFlash(null), 2600); };
  const nid = () => Math.floor(Math.random() * 1e9);
  const totalSavings = Object.values(s.kids).reduce((t, k) => t + k.savings + k.goals.reduce((a, g) => a + g.saved, 0), 0);

  function payAllowance() {
    const period = "this week";
    if (s.paidPeriods.includes(period)) { note("Already paid this period — nothing was sent twice."); return; }
    const need = 20000 + 20000;
    if (s.pool < need) { note("The family pool doesn't cover this week's allowances."); return; }
    setS((p) => {
      const d = { ...p.kids.daniel }, m = { ...p.kids.maya };
      d.spending += 10000; d.savings += 4000; d.goals = d.goals.map((g) => ({ ...g, saved: g.saved + 6000 }));
      m.spending += 16000; m.savings += 4000;
      return { ...p, pool: p.pool - need, kids: { daniel: d, maya: m }, paidPeriods: [...p.paidPeriods, period], txns: [
        { id: nid(), who: "Daniel", text: "Weekly allowance → spending", amount: 10000, kind: "allowance", at: "now" },
        { id: nid(), who: "Daniel", text: "Weekly allowance → savings", amount: 4000, kind: "allowance", at: "now" },
        { id: nid(), who: "Daniel", text: "Weekly allowance → New bicycle", amount: 6000, kind: "goal", at: "now" },
        { id: nid(), who: "Maya", text: "Weekly allowance → spending", amount: 16000, kind: "allowance", at: "now" },
        { id: nid(), who: "Maya", text: "Weekly allowance → savings", amount: 4000, kind: "allowance", at: "now" },
        ...p.txns] };
    });
    note("Allowances paid. Daniel's split sent 30% straight to his bicycle.");
  }
  function decide(id: number, status: "approved" | "declined") {
    setS((p) => {
      const r = p.requests.find((x) => x.id === id); if (!r || r.status !== "pending") return p;
      const kids = { ...p.kids };
      let pool = p.pool; const txns = [...p.txns];
      if (status === "approved") { kids[r.who] = { ...kids[r.who], spending: kids[r.who].spending + r.amount }; pool -= r.amount; txns.unshift({ id: nid(), who: kids[r.who].name, text: `Approved request: ${r.reason}`, amount: r.amount, kind: "transfer", at: "now" }); }
      return { ...p, pool, kids, txns, requests: p.requests.map((x) => (x.id === id ? { ...x, status } : x)) };
    });
    note(status === "approved" ? "Approved. The money moved from the pool to Daniel's spending." : "Declined. Daniel sees your answer.");
  }
  function contribute(kid: string, goalId: string, amount: number, from: "spending" | "savings") {
    setS((p) => {
      const k = { ...p.kids[kid] };
      if (k[from] < amount) return p;
      k[from] -= amount;
      k.goals = k.goals.map((g) => (g.id === goalId ? { ...g, saved: Math.min(g.target, g.saved + amount) } : g));
      return { ...p, kids: { ...p.kids, [kid]: k }, txns: [{ id: nid(), who: k.name, text: `Saved toward ${k.goals.find((g) => g.id === goalId)?.name}`, amount, kind: "goal", at: "now" }, ...p.txns] };
    });
    const g = s.kids[kid].goals.find((x) => x.id === goalId)!;
    note(g.saved + amount >= g.target ? `${s.kids[kid].name} reached the goal.` : `${formatMoney(amount, C)} moved into the goal.`);
  }
  function spend(kid: string, text: string, amount: number) {
    setS((p) => { const k = { ...p.kids[kid] }; if (k.spending < amount) return p; k.spending -= amount; return { ...p, kids: { ...p.kids, [kid]: k }, txns: [{ id: nid(), who: k.name, text, amount: -amount, kind: "spend", at: "now" }, ...p.txns] }; });
    note("Recorded. Later, Planned asks whether it was worth it.");
  }

  const Kid = ({ id }: { id: string }) => {
    const k = s.kids[id]; const g = k.goals[0]; const p = pct(g.saved, g.target); const w = weeksToReach(g.target - g.saved, g.weekly);
    return (
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-ink-3 text-[14px]">Good afternoon, {k.name}</p>
          <h3 className="text-[26px] font-semibold leading-tight mt-1">You&rsquo;ve saved <span className="text-save">{formatMoney(k.savings + g.saved, C)}</span> altogether.</h3>
          <p className="text-ink-2 mt-1">{k.streak} weeks of saving in a row — that&rsquo;s a habit now.</p>
          <div className="mt-6 border border-line rounded-lg p-5">
            <p className="text-[20px] font-semibold">{g.name}</p>
            <p className="text-[26px] font-semibold tnum mt-2 leading-none">{formatMoney(g.saved, C)} <span className="text-[14px] font-normal text-ink-3">of {formatMoney(g.target, C)}</span></p>
            <div className="flex items-center gap-3 mt-3"><Progress value={p} tone={p >= 80 ? "save" : "goal"} className="h-3" /><span className="tnum font-medium w-12 text-right">{p}%</span></div>
            <p className="text-[14.5px] text-ink-2 mt-3">{p >= 100 ? "You did it." : <>You&rsquo;re closer than you were yesterday.{w ? <> At {formatMoney(g.weekly, C)} a week, about <strong className="text-ink">{w} weeks</strong> to go.</> : null}</>}</p>
            <div className="mt-4 pt-4 border-t border-line">
              <p className="text-[13px] font-medium text-ink-3 uppercase tracking-wide mb-2">Ways to get there</p>
              <ul className="text-[14px] space-y-1.5"><li className="flex justify-between"><span>Next allowance</span><span className="text-ink-2">{formatMoney(20000, C)} · Saturday</span></li><li className="flex justify-between"><span>Move from spending</span><span className="text-ink-2">{formatMoney(k.spending, C)} available</span></li><li className="flex justify-between"><span>Finish a lesson</span><span className="text-ink-2">5 min</span></li></ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => contribute(id, g.id, 10000, "spending")} disabled={k.spending < 10000 || p >= 100}>Add {formatMoney(10000, C)} from spending</Button>
                <Button size="sm" variant="secondary" onClick={() => contribute(id, g.id, 20000, "savings")} disabled={k.savings < 20000 || p >= 100}>Add {formatMoney(20000, C)} from savings</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <div><p className="text-[16px] font-semibold mb-2">Your money</p><dl className="space-y-2 text-[14.5px]"><div className="flex justify-between"><dt className="text-ink-2">To spend</dt><dd className="tnum font-medium">{formatMoney(k.spending, C)}</dd></div><div className="flex justify-between"><dt className="text-ink-2">Savings</dt><dd className="tnum font-medium text-save">{formatMoney(k.savings, C)}</dd></div><div className="flex justify-between"><dt className="text-ink-2">In goals</dt><dd className="tnum font-medium text-goal">{formatMoney(g.saved, C)}</dd></div></dl>
            <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => spend(id, "School lunch", 5000)} disabled={k.spending < 5000}>Spend {formatMoney(5000, C)} on lunch</Button><Button size="sm" variant="secondary" onClick={() => spend(id, "Football", 15000)} disabled={k.spending < 15000}>Spend {formatMoney(15000, C)} on football</Button></div></div>
          <div><p className="text-[16px] font-semibold mb-2">Learning</p><p className="text-[14.5px] text-ink-2">{k.lessons + (s.lessonDone && id === "maya" ? 1 : 0)} of {LESSONS.length} lessons. <button className="text-brand font-medium hover:underline" onClick={() => setTab("Lesson")}>Continue</button></p></div>
          <div><p className="text-[16px] font-semibold mb-2">Achievements</p><div className="flex flex-wrap gap-1.5"><Pill tone="grow">First save</Pill><Pill tone="grow">Goal setter</Pill>{k.streak >= 4 && <Pill tone="grow">Four weeks steady</Pill>}{g.saved >= g.target && <Pill tone="save">Goal reached</Pill>}</div></div>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-line rounded-lg overflow-hidden">
      <div className="border-b border-line bg-warm px-4 sm:px-6 flex items-center gap-1 overflow-x-auto" role="tablist">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx("h-12 px-3 text-[14.5px] whitespace-nowrap border-b-2 -mb-px", tab === t ? "border-brand text-brand font-medium" : "border-transparent text-ink-2 hover:text-ink")}>{t}{t === "Approvals" && s.requests.some((r) => r.status === "pending") && <span className="ml-1.5 inline-flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-goal-soft text-goal text-[12px]">{s.requests.filter((r) => r.status === "pending").length}</span>}</button>)}
      </div>
      {flash && <div className="px-6 py-2 bg-save-soft text-save text-[14px] rise" role="status">{flash}</div>}
      <div className="p-5 sm:p-8 min-h-[420px]">
        {tab === "Family" && (
          <div>
            <p className="text-ink-3 text-[14px]">Good afternoon, Sarah</p>
            <h3 className="text-[26px] sm:text-[30px] font-semibold leading-tight mt-1">Your family has <span className="text-save">{formatMoney(totalSavings, C)}</span> saved.</h3>
            <p className="text-ink-2 mt-1">Savings are up 18% on last month. {s.requests.filter((r) => r.status === "pending").length ? "One request is waiting for you." : "Nothing is waiting for you."}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px]"><span>Family financial health <Pill tone="save">Good</Pill></span><span className="text-ink-2">Family pool <strong className="text-ink tnum">{formatMoney(s.pool, C)}</strong></span></div>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div><p className="text-[13px] font-medium text-ink-3 uppercase tracking-wide mb-3">Family progress</p>
                {Object.entries(s.kids).map(([id, k]) => k.goals.map((g) => <button key={g.id} onClick={() => setTab(k.name as "Daniel" | "Maya")} className="block w-full text-left py-3 border-b border-line last:border-0"><div className="flex justify-between text-[14.5px] mb-1.5"><span>{k.name} · {g.name}</span><span className="tnum text-ink-2">{pct(g.saved, g.target)}%</span></div><Progress value={pct(g.saved, g.target)} tone={pct(g.saved, g.target) >= 80 ? "save" : "goal"} /><span className="sr-only">{id}</span></button>))}
              </div>
              <div><p className="text-[13px] font-medium text-ink-3 uppercase tracking-wide mb-3">Your next move</p>
                <div className="border border-line rounded-lg p-4 bg-warm"><p className="font-medium">Saturday&rsquo;s allowances</p><p className="text-[14px] text-ink-2 mt-1">Daniel and Maya each receive {formatMoney(20000, C)} weekly. Daniel&rsquo;s is split 50/20/30 between spending, savings and his bicycle.</p><div className="mt-3"><Button size="sm" onClick={payAllowance}>Pay allowances now</Button></div><p className="text-[12.5px] text-ink-3 mt-2">Try pressing it twice.</p></div>
                {s.requests.some((r) => r.status === "pending") && <div className="border border-line rounded-lg p-4 mt-3"><p className="font-medium">Daniel asked for {formatMoney(25000, C)}</p><p className="text-[14px] text-ink-2 mt-1">School supplies for term</p><button className="mt-2 text-[14px] font-medium text-brand hover:underline" onClick={() => setTab("Approvals")}>Review</button></div>}
              </div>
            </div>
          </div>
        )}
        {tab === "Daniel" && <Kid id="daniel" />}
        {tab === "Maya" && <Kid id="maya" />}
        {tab === "Approvals" && (
          <div className="max-w-xl">
            <h3 className="text-[24px] font-semibold">Needs your attention</h3>
            {s.requests.filter((r) => r.status === "pending").length === 0 ? <p className="text-ink-2 mt-4">Nothing needs your attention.</p> : s.requests.filter((r) => r.status === "pending").map((r) => (
              <div key={r.id} className="border border-line rounded-lg p-5 mt-4"><p className="text-[17px] font-medium">{s.kids[r.who].name} asked for {formatMoney(r.amount, C)}</p><p className="text-ink-2 mt-1">{r.reason}</p><div className="mt-4 flex gap-2"><Button size="sm" onClick={() => decide(r.id, "approved")}><Check className="h-4 w-4" />Approve</Button><Button size="sm" variant="secondary" onClick={() => decide(r.id, "declined")}><X className="h-4 w-4" />Decline</Button></div></div>
            ))}
            {s.requests.filter((r) => r.status !== "pending").length > 0 && <div className="mt-8"><p className="text-[14px] font-medium text-ink-3 mb-2">Recently decided</p>{s.requests.filter((r) => r.status !== "pending").map((r) => <p key={r.id} className="text-[14.5px] py-1.5 flex justify-between"><span>{s.kids[r.who].name} · {r.reason}</span><Pill tone={r.status === "approved" ? "save" : "neutral"}>{r.status}</Pill></p>)}</div>}
          </div>
        )}
        {tab === "Transactions" && (
          <div className="max-w-2xl">
            <h3 className="text-[24px] font-semibold mb-4">Transactions</h3>
            <ul className="divide-y divide-line">{s.txns.map((t) => <li key={t.id} className="py-3 flex items-center gap-3"><div className="flex-1 min-w-0"><p className="font-medium text-[15px] truncate">{t.text}</p><p className="text-[13px] text-ink-3">{t.who} · {t.at}</p></div><Pill tone={t.kind === "spend" ? "spend" : t.kind === "goal" ? "save" : t.kind === "allowance" || t.kind === "pool" ? "brand" : "neutral"}>{t.kind === "goal" ? "Saved to goal" : t.kind === "pool" ? "Added to pool" : t.kind[0].toUpperCase() + t.kind.slice(1)}</Pill><span className={cx("tnum font-medium w-32 text-right", t.amount < 0 ? "text-spend" : t.kind === "goal" ? "text-save" : "")}>{t.amount < 0 ? "−" : "+"}{formatMoney(Math.abs(t.amount), C).replace("UGX ", "")}</span></li>)}</ul>
          </div>
        )}
        {tab === "Lesson" && <DemoLesson done={s.lessonDone} onDone={() => { setS((p) => ({ ...p, lessonDone: true })); note("Lesson finished. Maya earned “Curious”."); }} />}
      </div>
      <div className="border-t border-line bg-warm px-5 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[14.5px]"><span className="text-ink-2">This is a simulation. In the real product, every one of these actions is a ledger entry with an audit trail.</span><Link href="/signup" className="font-medium text-brand hover:underline shrink-0">Create your own family →</Link></div>
    </div>
  );
}

function DemoLesson({ done, onDone }: { done: boolean; onDone: () => void }) {
  const lesson = LESSONS.find((l) => l.slug === "interest")!;
  const [picked, setPicked] = React.useState<number | null>(null);
  const [submitted, setSubmitted] = React.useState(done);
  return (
    <div className="max-w-2xl">
      <Pill tone="grow">Level 3</Pill>
      <h3 className="text-[26px] font-semibold mt-2">{lesson.title}</h3>
      <p className="text-ink-2 text-[16px] mt-1 mb-5">{lesson.summary}</p>
      <div className="space-y-3 text-[15.5px] text-ink-2 leading-relaxed">{lesson.body.map((b, i) => <p key={i}>{b}</p>)}</div>
      <div className="border border-line rounded-lg p-5 mt-6">
        <p className="font-medium">{lesson.question.prompt}</p>
        <div className="mt-3 space-y-2">{lesson.question.options.map((o, i) => <button key={i} disabled={submitted} onClick={() => setPicked(i)} className={cx("w-full text-left px-4 py-2.5 rounded-md border text-[15px]", picked === i ? "border-brand bg-brand-soft" : "border-line hover:bg-warm", submitted && i === lesson.question.answer && "border-save bg-save-soft")}>{o}</button>)}</div>
        {submitted && <p className="mt-3 text-[14.5px] text-ink-2">{lesson.question.why}</p>}
      </div>
      <div className="border border-line rounded-lg p-5 mt-4 bg-warm"><p className="text-[13px] font-medium text-ink-3 uppercase tracking-wide">Try this for real</p><p className="mt-1">{lesson.challenge}</p></div>
      {!submitted && <Button className="mt-5" disabled={picked === null} onClick={() => { setSubmitted(true); onDone(); }}>Finish lesson</Button>}
    </div>
  );
}
