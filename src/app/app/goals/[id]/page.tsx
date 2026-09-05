import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { goals, accounts, transactions } from "@/db/schema";
import { requireParent } from "@/lib/auth";
import { forecastGoal } from "@/lib/goals";
import { listMembers, familyPool, memberAccounts, accountNameMap } from "@/lib/family";
import { Money, Progress, Pill } from "@/components/ui";
import { ContributeButton, ArchiveGoalButton } from "@/components/app/Actions";
import { WhatIf } from "@/components/app/WhatIf";
import { TxnList } from "@/components/app/Shared";
import { pct } from "@/lib/money";
import { longDate } from "@/lib/format";

export default async function GoalDetail({ params }: { params: Promise<{ id: string }> }) {
  const v = await requireParent();
  const { id } = await params;
  const [row] = await db.select({ goal: goals, account: accounts }).from(goals).innerJoin(accounts, eq(accounts.id, goals.accountId)).where(and(eq(goals.id, id), eq(goals.familyId, v.family.id))).limit(1);
  if (!row) notFound();
  const g = row.goal; const saved = row.account.balance; const c = v.family.currency;
  const [history, members, pool, names] = await Promise.all([db.select().from(transactions).where(and(eq(transactions.goalId, id))).orderBy(transactions.createdAt), listMembers(v.family.id), familyPool(v.family.id), accountNameMap(v.family.id)]);
  const f = forecastGoal(g.targetAmount, saved, history.filter((h) => h.status === "posted"));
  const owner = g.memberId ? members.find((m) => m.member.id === g.memberId)?.user.displayName : "The whole family";
  const ownerAccts = g.memberId ? await memberAccounts(v.family.id, g.memberId) : null;
  const sources = [{ key: "family_pool" as const, label: "Family pool", balance: pool.balance }, ...(ownerAccts ? [{ key: "savings" as const, label: `${owner}'s savings`, balance: ownerAccts.savings.balance }, { key: "spending" as const, label: `${owner}'s spending`, balance: ownerAccts.spending.balance }] : [])];
  const p = pct(saved, g.targetAmount);
  const memberNames = Object.fromEntries(members.map((m) => [m.member.id, m.user.displayName]));
  return (
    <div className="rise max-w-3xl">
      <Link href="/app/goals" className="text-[14px] text-ink-3 hover:text-ink">← Goals</Link>
      <div className="mt-2 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-[14.5px] text-ink-2">{owner}{g.isShared && <Pill tone="brand" className="ml-2">Shared</Pill>}</p>
          <h1 className="text-[32px] font-semibold leading-tight">{g.name}</h1>
        </div>
        {g.status === "active" && <div className="flex gap-2 items-center"><ContributeButton goalId={g.id} goalName={g.name} currency={c} sources={sources} /><ArchiveGoalButton goalId={g.id} hasMoney={saved > 0} /></div>}
      </div>
      <div className="mt-8">
        <p className="text-[36px] font-semibold tnum leading-none"><Money amount={saved} currency={c} /> <span className="text-[18px] text-ink-3 font-normal">of <Money amount={g.targetAmount} currency={c} compact /></span></p>
        <div className="flex items-center gap-3 mt-4"><Progress value={p} tone={g.status === "completed" ? "save" : p >= 80 ? "save" : "goal"} className="h-3" /><span className="tnum text-[15px] font-medium w-12 text-right">{p}%</span></div>
        <p className="mt-3 text-[15.5px] text-ink-2">
          {g.status === "completed" ? <>Reached {g.completedAt ? longDate(g.completedAt) : ""}. Worth marking.</> : g.status === "archived" ? "This goal was closed." : f.estimatedDate ? <>At the current pace of <strong className="text-ink"><Money amount={f.weeklyRate} currency={c} compact /></strong> a week, expected around <strong className="text-ink">{longDate(f.estimatedDate)}</strong>{f.consistentWeeks >= 2 ? ` — ${f.consistentWeeks} weeks of steady saving so far.` : "."}{g.targetDate && f.estimatedDate > g.targetDate ? <span className="text-goal"> That&rsquo;s after the hoped-for date of {longDate(g.targetDate)}.</span> : null}</> : <>No contributions yet, so there&rsquo;s no forecast. The first one starts the clock.</>}
        </p>
      </div>
      {g.status === "active" && <div className="mt-8"><WhatIf remaining={g.targetAmount - saved} currency={c} currentWeekly={f.weeklyRate} /></div>}
      <section className="mt-12">
        <h2 className="text-[19px] font-semibold mb-2">Contribution history</h2>
        {history.length ? <TxnList rows={[...history].reverse()} currency={c} accounts={names} memberNames={memberNames} names /> : <p className="text-[14.5px] text-ink-3">Nothing yet.</p>}
      </section>
    </div>
  );
}
