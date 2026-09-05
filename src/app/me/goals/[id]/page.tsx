import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { goals, accounts, transactions } from "@/db/schema";
import { requireViewer } from "@/lib/auth";
import { forecastGoal } from "@/lib/goals";
import { memberAccounts, accountNameMap, getRules } from "@/lib/family";
import { Money, Progress } from "@/components/ui";
import { ContributeButton } from "@/components/app/Actions";
import { WithdrawFromGoalButton } from "@/components/me/Actions";
import { WhatIf } from "@/components/app/WhatIf";
import { TxnList } from "@/components/app/Shared";
import { pct } from "@/lib/money";
import { longDate } from "@/lib/format";

export default async function MyGoal({ params }: { params: Promise<{ id: string }> }) {
  const v = await requireViewer();
  const { id } = await params;
  const [row] = await db.select({ goal: goals, account: accounts }).from(goals).innerJoin(accounts, eq(accounts.id, goals.accountId)).where(and(eq(goals.id, id), eq(goals.familyId, v.family.id), eq(goals.memberId, v.member.id))).limit(1);
  if (!row) notFound();
  const g = row.goal; const saved = row.account.balance; const c = v.family.currency;
  const [history, accts, names, rules] = await Promise.all([db.select().from(transactions).where(eq(transactions.goalId, id)).orderBy(transactions.createdAt), memberAccounts(v.family.id, v.member.id), accountNameMap(v.family.id), getRules(v.family.id)]);
  const f = forecastGoal(g.targetAmount, saved, history.filter((h) => h.status === "posted"));
  const p = pct(saved, g.targetAmount);
  return (
    <div className="rise max-w-3xl">
      <Link href="/me/goals" className="text-[14px] text-ink-3 hover:text-ink">← My goals</Link>
      <h1 className="text-[32px] font-semibold leading-tight mt-2">{g.name}</h1>
      <p className="text-[36px] font-semibold tnum mt-6 leading-none"><Money amount={saved} currency={c} /> <span className="text-[18px] text-ink-3 font-normal">of <Money amount={g.targetAmount} currency={c} compact /></span></p>
      <div className="flex items-center gap-3 mt-4"><Progress value={p} tone={p >= 100 ? "save" : p >= 80 ? "save" : "goal"} className="h-3" /><span className="tnum text-[15px] font-medium w-12 text-right">{p}%</span></div>
      <p className="mt-3 text-[16px] text-ink-2">
        {g.status === "completed" ? <>You reached it{g.completedAt ? ` on ${longDate(g.completedAt)}` : ""}. Remember how that felt next time saving is hard.</> : p >= 80 ? <>So close. {f.estimatedDate ? <>At your pace, about <strong className="text-ink">{longDate(f.estimatedDate)}</strong>.</> : null}</> : saved > 0 ? <>You&rsquo;re {p}% there — closer than you were yesterday.{f.estimatedDate ? <> Keep saving <strong className="text-ink"><Money amount={f.weeklyRate} currency={c} compact /></strong> a week and you&rsquo;ll get there around <strong className="text-ink">{longDate(f.estimatedDate)}</strong>.</> : null}</> : <>Nothing in yet. The first amount is the hardest and the most important.</>}
      </p>
      {g.status === "active" && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2"><ContributeButton goalId={g.id} goalName={g.name} currency={c} sources={[{ key: "spending", label: "Spending", balance: accts.spending.balance }, { key: "savings", label: "Savings", balance: accts.savings.balance }]} /><WithdrawFromGoalButton goalId={g.id} currency={c} needsApproval={rules.goalWithdrawalNeedsApproval} saved={saved} /></div>
          <div className="mt-8"><WhatIf remaining={g.targetAmount - saved} currency={c} currentWeekly={f.weeklyRate} /></div>
        </>
      )}
      <section className="mt-12"><h2 className="text-[19px] font-semibold mb-2">Every contribution</h2>{history.length ? <TxnList rows={[...history].reverse()} currency={c} accounts={names} memberNames={{}} /> : <p className="text-[14.5px] text-ink-3">Nothing yet.</p>}</section>
    </div>
  );
}
