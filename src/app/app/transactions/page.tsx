import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { requireParent } from "@/lib/auth";
import { listTransactions, accountNameMap, listMembers, familyPool } from "@/lib/family";
import { PageHeader } from "@/components/app/Shell";
import { DepositButton, GiveButton, ReverseButton, ReconcileBadge } from "@/components/app/Actions";
import { TxnList } from "@/components/app/Shared";
import { EmptyState, Money } from "@/components/ui";

export const metadata = { title: "Transactions" };

export default async function Transactions({ searchParams }: { searchParams: Promise<{ memberId?: string; action?: string }> }) {
  const v = await requireParent();
  const sp = await searchParams;
  const [rows, names, members, pool] = await Promise.all([listTransactions(v.family.id, { memberId: sp.memberId, limit: 100 }), accountNameMap(v.family.id), listMembers(v.family.id), familyPool(v.family.id)]);
  const c = v.family.currency;
  const simple = members.map((m) => ({ id: m.member.id, name: m.user.displayName, role: m.member.role }));
  const memberNames = Object.fromEntries(simple.map((m) => [m.id, m.name]));
  const kids = simple.filter((m) => m.role === "child");
  return (
    <div className="rise">
      <PageHeader title="Transactions" sub={<>Every movement of money, in order. Family pool: <strong className="text-ink tnum"><Money amount={pool.balance} currency={c} compact /></strong></>} action={<div className="flex gap-2"><GiveButton currency={c} members={simple} /><DepositButton currency={c} defaultOpen={sp.action === "deposit"} /></div>} />
      {kids.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6 text-[13.5px]" role="tablist" aria-label="Filter by member">
          <Link href="/app/transactions" role="tab" aria-selected={!sp.memberId} className={`h-8 px-3 inline-flex items-center rounded-full border ${!sp.memberId ? "border-ink bg-ink text-white" : "border-line hover:bg-warm"}`}>Everyone</Link>
          {kids.map((k) => <Link key={k.id} href={`/app/transactions?memberId=${k.id}`} role="tab" aria-selected={sp.memberId === k.id} className={`h-8 px-3 inline-flex items-center rounded-full border ${sp.memberId === k.id ? "border-ink bg-ink text-white" : "border-line hover:bg-warm"}`}>{k.name}</Link>)}
        </div>
      )}
      {rows.length === 0 ? (
        <EmptyState icon={<ArrowLeftRight className="h-5 w-5" />} title="No transactions yet" body="Start by adding money to the family pool. Allowances and approved requests are paid from there." action={<DepositButton currency={c} />} />
      ) : <TxnList rows={rows} currency={c} names accounts={names} memberNames={memberNames} action={(t) => <ReverseButton id={t.id} />} />}
      <div className="mt-10 pt-4 border-t border-line"><ReconcileBadge /></div>
    </div>
  );
}
