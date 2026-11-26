"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { Button, Progress, Pill, cx } from "@/components/ui";
import { formatMoney, pct } from "@/lib/money";
import { weeksToReach } from "@/lib/goals";

const CURRENCY = "UGX";
type KidId = "daniel" | "maya";
type RequestStatus = "pending" | "approved" | "declined";
type Transaction = { id: number; who: string; description: string; amount: number; date: string };
type Kid = {
  name: string;
  age: number;
  spending: number;
  savings: number;
  goal: { name: string; saved: number; target: number; weekly: number };
};
type DemoState = {
  pool: number;
  kids: Record<KidId, Kid>;
  request: { who: KidId; amount: number; reason: string; status: RequestStatus };
  transactions: Transaction[];
  allowancePaid: boolean;
};

const initialState: DemoState = {
  pool: 620000,
  kids: {
    daniel: { name: "Daniel", age: 12, spending: 34000, savings: 210000, goal: { name: "New bicycle", saved: 180000, target: 300000, weekly: 15000 } },
    maya: { name: "Maya", age: 9, spending: 12000, savings: 96000, goal: { name: "Art supplies", saved: 41000, target: 50000, weekly: 8000 } },
  },
  request: { who: "daniel", amount: 25000, reason: "School supplies for term", status: "pending" },
  allowancePaid: false,
  transactions: [
    { id: 1, who: "Maya", description: "Weekly allowance → savings", amount: 4000, date: "Saturday" },
    { id: 2, who: "Daniel", description: "Saved toward New bicycle", amount: 15000, date: "Friday" },
    { id: 3, who: "Daniel", description: "School lunch", amount: -5000, date: "Thursday" },
    { id: 4, who: "Sarah", description: "Added to family pool", amount: 300000, date: "Monday" },
  ],
};

export function KatoDemo() {
  const [state, setState] = React.useState<DemoState>(initialState);
  const [view, setView] = React.useState<"family" | KidId>("family");
  const [notice, setNotice] = React.useState("");
  const nextId = React.useRef(10);
  const pending = state.request.status === "pending";
  const totalSaved = Object.values(state.kids).reduce((sum, kid) => sum + kid.savings + kid.goal.saved, 0);

  function announce(message: string) { setNotice(message); }
  function decideRequest(status: "approved" | "declined") {
    setState((current) => {
      if (current.request.status !== "pending") return current;
      const next = { ...current, request: { ...current.request, status } };
      if (status === "approved") {
        next.pool -= current.request.amount;
        next.kids = { ...current.kids, daniel: { ...current.kids.daniel, spending: current.kids.daniel.spending + current.request.amount } };
        next.transactions = [{ id: nextId.current++, who: "Daniel", description: "Approved: school supplies", amount: current.request.amount, date: "Just now" }, ...current.transactions];
      }
      return next;
    });
    announce(status === "approved" ? "Request approved. The amount was added to Daniel’s spending money." : "Request declined. The decision is recorded.");
  }
  function payAllowances() {
    if (state.allowancePaid) { announce("This week’s allowances have already been paid."); return; }
    if (state.pool < 40000) { announce("There isn’t enough in the family pool to pay both allowances."); return; }
    setState((current) => ({
      ...current,
      pool: current.pool - 40000,
      allowancePaid: true,
      kids: {
        daniel: { ...current.kids.daniel, spending: current.kids.daniel.spending + 10000, savings: current.kids.daniel.savings + 4000, goal: { ...current.kids.daniel.goal, saved: current.kids.daniel.goal.saved + 6000 } },
        maya: { ...current.kids.maya, spending: current.kids.maya.spending + 16000, savings: current.kids.maya.savings + 4000 },
      },
      transactions: [
        { id: nextId.current++, who: "Daniel", description: "Weekly allowance · spending", amount: 10000, date: "Just now" },
        { id: nextId.current++, who: "Daniel", description: "Weekly allowance · savings", amount: 4000, date: "Just now" },
        { id: nextId.current++, who: "Daniel", description: "Weekly allowance · bicycle goal", amount: 6000, date: "Just now" },
        { id: nextId.current++, who: "Maya", description: "Weekly allowance · spending", amount: 16000, date: "Just now" },
        { id: nextId.current++, who: "Maya", description: "Weekly allowance · savings", amount: 4000, date: "Just now" },
        ...current.transactions,
      ],
    }));
    announce("Allowances paid. Daniel’s allowance was split automatically between spending, savings and his bicycle goal.");
  }
  function addToGoal(id: KidId, amount: number) {
    const kid = state.kids[id];
    const contribution = Math.min(amount, kid.spending, kid.goal.target - kid.goal.saved);
    if (contribution <= 0) return;
    setState((current) => ({
      ...current,
      kids: { ...current.kids, [id]: { ...current.kids[id], spending: current.kids[id].spending - contribution, goal: { ...current.kids[id].goal, saved: current.kids[id].goal.saved + contribution } } },
      transactions: [{ id: nextId.current++, who: kid.name, description: `Added to ${kid.goal.name}`, amount: contribution, date: "Just now" }, ...current.transactions],
    }));
    announce(`${formatMoney(contribution, CURRENCY)} moved into ${kid.goal.name}.`);
  }
  function recordSpend(id: KidId, amount: number, description: string) {
    if (state.kids[id].spending < amount) { announce("There isn’t enough spending money for that."); return; }
    setState((current) => ({
      ...current,
      kids: { ...current.kids, [id]: { ...current.kids[id], spending: current.kids[id].spending - amount } },
      transactions: [{ id: nextId.current++, who: current.kids[id].name, description, amount: -amount, date: "Just now" }, ...current.transactions],
    }));
    announce(`${description} recorded. The family activity has been updated.`);
  }

  const tabs = [{ id: "family" as const, label: "Family" }, { id: "daniel" as const, label: "Daniel" }, { id: "maya" as const, label: "Maya" }];
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm" aria-label="Interactive Planned family demo">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-7">
        <div><p className="text-sm font-semibold text-ink">The Kato family</p><p className="text-xs text-ink-3 mt-0.5">A live, resettable example family</p></div>
        <nav aria-label="Demo views" className="flex items-center gap-1 rounded-full bg-warm p-1">
          {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setView(tab.id)} aria-current={view === tab.id ? "page" : undefined} className={cx("rounded-full px-3.5 py-2 text-sm transition-colors", view === tab.id ? "bg-white text-brand shadow-sm font-semibold" : "text-ink-2 hover:text-ink")}>{tab.label}</button>)}
        </nav>
      </div>

      {notice && <div role="status" aria-live="polite" className="flex items-start justify-between gap-3 border-b border-line bg-save-soft px-5 py-3 text-sm text-ink sm:px-7"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss message" className="shrink-0"><X className="h-4 w-4" /></button></div>}

      <div className="p-5 sm:p-8">
        {view === "family" ? (
          <div className="mx-auto max-w-4xl">
            <p className="text-sm text-ink-3">Good afternoon, Sarah</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Your family is building good money habits.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2">You have <strong className="text-ink">{formatMoney(totalSaved, CURRENCY)}</strong> saved across the family. Here’s the one thing that needs your attention first.</p>

            {pending ? (
              <section className="mt-7 rounded-xl border border-brand/25 bg-brand-soft/40 p-5 sm:p-6" aria-labelledby="request-heading">
                <div className="flex flex-wrap items-center justify-between gap-2"><Pill tone="brand">Needs your decision</Pill><span className="text-xs text-ink-3">A request from Daniel</span></div>
                <h3 id="request-heading" className="mt-3 text-lg font-semibold text-ink">School supplies for term</h3>
                <p className="mt-1 text-sm text-ink-2">Daniel is asking for {formatMoney(state.request.amount, CURRENCY)}.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button onClick={() => decideRequest("approved")}><Check className="mr-1.5 h-4 w-4" />Approve request</Button>
                  <Button variant="secondary" onClick={() => decideRequest("declined")}>Decline</Button>
                </div>
              </section>
            ) : (
              <section className="mt-7 rounded-xl border border-line p-5 sm:p-6">
                <Pill tone="save">All caught up</Pill>
                <h3 className="mt-3 text-lg font-semibold text-ink">No family requests waiting.</h3>
                <p className="mt-1 text-sm text-ink-2">Your next planned task is the children’s weekly allowance.</p>
                <Button className="mt-4" onClick={payAllowances} disabled={state.allowancePaid}>{state.allowancePaid ? "This week’s allowances paid" : "Pay weekly allowances"}</Button>
              </section>
            )}

            <div className="mt-8 flex flex-wrap items-end justify-between gap-2">
              <div><h3 className="text-base font-semibold text-ink">Growing, week by week</h3><p className="mt-1 text-sm text-ink-2">Each child has their own money and a goal to work towards.</p></div>
              <span className="text-xs text-ink-3">Family pool · <strong className="text-ink">{formatMoney(state.pool, CURRENCY)}</strong></span>
            </div>
            <div className="mt-3 divide-y divide-line border-y border-line">
              {(Object.entries(state.kids) as [KidId, Kid][]).map(([id, kid]) => {
                const progress = pct(kid.goal.saved, kid.goal.target);
                return <button type="button" key={id} onClick={() => setView(id)} className="group flex w-full items-center gap-4 py-4 text-left hover:bg-warm/60">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">{kid.name[0]}</span>
                  <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-ink">{kid.name} <span className="font-normal text-ink-3">· {kid.age}</span></strong><span className="text-xs text-ink-2">{formatMoney(kid.goal.saved, CURRENCY)} of {formatMoney(kid.goal.target, CURRENCY)}</span></span><span className="mt-2 block"><Progress value={progress} /></span><span className="mt-1.5 block text-xs text-ink-3">{kid.goal.name} · {progress}% complete</span></span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                </button>;
              })}
            </div>
            <details className="group mt-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2 text-sm font-medium text-ink-2 hover:text-ink"><span>Recent family activity</span><ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
              <TransactionList transactions={state.transactions.slice(0, 6)} />
            </details>
          </div>
        ) : (
          <KidView kidId={view} kid={state.kids[view]} onBack={() => setView("family")} onAdd={addToGoal} onSpend={recordSpend} transactions={state.transactions.filter((t) => t.who === state.kids[view].name).slice(0, 3)} />
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-line bg-warm/70 px-5 py-4 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <span>Demo only · Changes reset when you refresh.</span>
        <span>Every action updates the example family ledger.</span>
      </div>
    </section>
  );
}

function KidView({ kidId, kid, onBack, onAdd, onSpend, transactions }: { kidId: KidId; kid: Kid; onBack: () => void; onAdd: (id: KidId, amount: number) => void; onSpend: (id: KidId, amount: number, description: string) => void; transactions: Transaction[] }) {
  const progress = pct(kid.goal.saved, kid.goal.target);
  const weeks = weeksToReach(kid.goal.target - kid.goal.saved, kid.goal.weekly);
  const complete = progress >= 100;
  return (
    <div className="mx-auto max-w-3xl">
      <button type="button" onClick={onBack} className="mb-6 text-sm font-medium text-brand hover:underline">← Back to family</button>
      <p className="text-sm text-ink-3">{kid.name}’s money</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Small steps add up.</h2>
      <p className="mt-2 text-sm text-ink-2">You have {formatMoney(kid.spending + kid.savings + kid.goal.saved, CURRENCY)} across spending, savings and your goal.</p>

      <section className="mt-7 rounded-xl border border-line p-5 sm:p-7" aria-labelledby="goal-title">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Your goal</p><h3 id="goal-title" className="mt-1 text-xl font-semibold text-ink">{kid.goal.name}</h3></div><Pill tone={complete ? "save" : "brand"}>{complete ? "Goal reached" : `${progress}% there`}</Pill></div>
        <p className="mt-5 text-2xl font-semibold tabular-nums text-ink">{formatMoney(kid.goal.saved, CURRENCY)} <span className="text-sm font-normal text-ink-3">of {formatMoney(kid.goal.target, CURRENCY)}</span></p>
        <div className="mt-3"><Progress value={progress} /></div>
        <p className="mt-3 text-sm text-ink-2">{complete ? "You did it. Enjoy reaching your goal!" : `Keep saving ${formatMoney(kid.goal.weekly, CURRENCY)} each week and you could get there in about ${weeks ?? "a few"} weeks.`}</p>
        <div className="mt-6 border-t border-line pt-5"><p className="text-sm font-semibold text-ink">Add to your goal</p><p className="mt-1 text-sm text-ink-2">Move a little from your spending money whenever you’re ready.</p><Button className="mt-3" onClick={() => onAdd(kidId, 10000)} disabled={kid.spending < 10000 || complete}>Move {formatMoney(10000, CURRENCY)} to goal</Button></div>
      </section>

      <section className="mt-7">
        <h3 className="text-base font-semibold text-ink">Your money, at a glance</h3>
        <dl className="mt-3 divide-y divide-line border-y border-line">
          <div className="flex items-center justify-between py-3"><dt className="text-sm text-ink-2">Ready to spend</dt><dd className="text-sm font-semibold tabular-nums text-ink">{formatMoney(kid.spending, CURRENCY)}</dd></div>
          <div className="flex items-center justify-between py-3"><dt className="text-sm text-ink-2">Personal savings</dt><dd className="text-sm font-semibold tabular-nums text-ink">{formatMoney(kid.savings, CURRENCY)}</dd></div>
          <div className="flex items-center justify-between py-3"><dt className="text-sm text-ink-2">Saved for {kid.goal.name}</dt><dd className="text-sm font-semibold tabular-nums text-ink">{formatMoney(kid.goal.saved, CURRENCY)}</dd></div>
        </dl>
        <details className="group mt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2 text-sm font-medium text-ink-2 hover:text-ink"><span>Try a spending decision</span><ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
          <p className="pb-3 text-sm text-ink-2">Choose an example purchase. It will be recorded in your family’s activity.</p>
          <div className="flex flex-wrap gap-2 pb-2"><Button size="sm" variant="secondary" onClick={() => onSpend(kidId, 5000, "School lunch")} disabled={kid.spending < 5000}>School lunch · {formatMoney(5000, CURRENCY)}</Button><Button size="sm" variant="secondary" onClick={() => onSpend(kidId, 15000, "Football")} disabled={kid.spending < 15000}>Football · {formatMoney(15000, CURRENCY)}</Button></div>
        </details>
      </section>
      {transactions.length > 0 && <section className="mt-7"><h3 className="text-sm font-semibold text-ink">Latest activity</h3><TransactionList transactions={transactions} /></section>}
    </div>
  );
}

function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return <ul className="mt-2 divide-y divide-line">{transactions.map((transaction) => <li key={transaction.id} className="flex items-center justify-between gap-4 py-3"><span className="min-w-0"><span className="block truncate text-sm font-medium text-ink">{transaction.description}</span><span className="mt-0.5 block text-xs text-ink-3">{transaction.who} · {transaction.date}</span></span><span className={cx("shrink-0 text-sm font-semibold tabular-nums", transaction.amount < 0 ? "text-ink-2" : "text-brand")}>{transaction.amount < 0 ? "−" : "+"}{formatMoney(Math.abs(transaction.amount), CURRENCY)}</span></li>)}</ul>;
}
