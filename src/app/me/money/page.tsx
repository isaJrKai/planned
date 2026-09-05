import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { approvalRequests } from "@/db/schema";
import { requireViewer } from "@/lib/auth";
import { memberAccounts, listTransactions, accountNameMap, getRules, listAllowanceRules } from "@/lib/family";
import { PageHeader } from "@/components/app/Shell";
import { SpendButton, MoveToSavingsButton, RequestMoneyButton, ReflectButtons } from "@/components/me/Actions";
import { TxnList } from "@/components/app/Shared";
import { Money, Pill, SectionTitle, EmptyState } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { relDate } from "@/lib/format";

export const metadata = { title: "My money" };
export default async function MyMoney() {
  const v = await requireViewer();
  const c = v.family.currency; const me = v.member.id;
  const [accts, txns, names, rules, allowance, requests] = await Promise.all([memberAccounts(v.family.id, me), listTransactions(v.family.id, { memberId: me, limit: 60 }), accountNameMap(v.family.id), getRules(v.family.id), listAllowanceRules(v.family.id, me), db.select().from(approvalRequests).where(and(eq(approvalRequests.memberId, me))).orderBy(desc(approvalRequests.createdAt)).limit(5)]);
  const spends = txns.filter((t) => t.kind === "spend" && t.status === "posted");
  const wants = spends.filter((t) => (t.metadata as { needOrWant?: string } | null)?.needOrWant === "want").length;
  return (
    <div className="rise">
      <PageHeader title="My money" sub="Where it is, where it went, and what you thought about it." action={<div className="flex gap-2 flex-wrap"><SpendButton memberId={me} currency={c} spendingBalance={accts.spending.balance} approvalThreshold={rules.approvalThreshold} /><MoveToSavingsButton memberId={me} currency={c} spendingBalance={accts.spending.balance} savingsBalance={accts.savings.balance} /><RequestMoneyButton currency={c} /></div>} />
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-6 border-y border-line py-6">
        <div><dt className="text-[12.5px] text-ink-3 uppercase tracking-wide">To spend</dt><dd className="text-[24px] font-semibold tnum mt-1"><Money amount={accts.spending.balance} currency={c} compact /></dd></div>
        <div><dt className="text-[12.5px] text-ink-3 uppercase tracking-wide">Savings</dt><dd className="text-[24px] font-semibold tnum mt-1 text-save"><Money amount={accts.savings.balance} currency={c} compact /></dd></div>
        <div><dt className="text-[12.5px] text-ink-3 uppercase tracking-wide">In goals</dt><dd className="text-[24px] font-semibold tnum mt-1 text-goal"><Money amount={accts.goalAccounts.reduce((s, a) => s + a.balance, 0)} currency={c} compact /></dd></div>
      </dl>
      <div className="mt-4 text-[14.5px] text-ink-2 space-y-1">
        {allowance[0]?.active && <p>Your allowance: <strong className="text-ink">{formatMoney(allowance[0].amount, c)}</strong> {allowance[0].cadence}, next {relDate(allowance[0].nextDueAt)}. {allowance[0].savePercent}% goes to savings automatically.</p>}
        {rules.dailySpendLimit > 0 && <p>Daily spending limit: {formatMoney(rules.dailySpendLimit, c)}.</p>}
        {rules.approvalThreshold > 0 && <p>Anything over {formatMoney(rules.approvalThreshold, c)} needs a parent to approve.</p>}
        {spends.length >= 3 && <p>{wants} of your last {spends.length} purchases were wants. {wants / spends.length > 0.6 ? "Worth a look." : "That's a healthy mix."}</p>}
      </div>
      {requests.length > 0 && (
        <section className="mt-10"><SectionTitle title="Your requests" /><ul className="divide-y divide-line">{requests.map((r) => <li key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-[14.5px]"><span><Money amount={r.amount} currency={c} compact /> · {r.reason}{r.resolutionNote && <span className="block text-[13px] text-ink-3">Parent said: {r.resolutionNote}</span>}</span><Pill tone={r.status === "approved" ? "save" : r.status === "pending" ? "goal" : "neutral"}>{r.status}</Pill></li>)}</ul></section>
      )}
      <section className="mt-10">
        <SectionTitle title="Everything that happened" />
        {txns.length ? <TxnList rows={txns} currency={c} accounts={names} memberNames={{}} action={(t) => t.kind === "spend" ? <ReflectButtons txnId={t.id} current={(t.metadata as { worthIt?: string } | null)?.worthIt} /> : null} /> : <EmptyState title="You haven't made any transactions yet" body="When your allowance arrives or you record something you bought, it'll show up here." />}
      </section>
    </div>
  );
}
