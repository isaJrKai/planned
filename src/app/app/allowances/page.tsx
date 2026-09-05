import { Wallet } from "lucide-react";
import { requireParent } from "@/lib/auth";
import { listAllowanceRules, listMembers, listGoals, familyPool } from "@/lib/family";
import { PageHeader } from "@/components/app/Shell";
import { AllowanceButton, AllowanceRowActions, DepositButton } from "@/components/app/Actions";
import { Money, EmptyState, Pill, Notice } from "@/components/ui";
import { relDate, WEEKDAYS } from "@/lib/format";

export const metadata = { title: "Allowances" };

export default async function Allowances() {
  const v = await requireParent();
  const [rules, members, goals, pool] = await Promise.all([listAllowanceRules(v.family.id), listMembers(v.family.id), listGoals(v.family.id), familyPool(v.family.id)]);
  const c = v.family.currency;
  const simple = members.map((m) => ({ id: m.member.id, name: m.user.displayName, role: m.member.role }));
  const nameOf = (id: string) => simple.find((m) => m.id === id)?.name ?? "";
  const weeklyNeed = rules.filter((r) => r.active).reduce((s, r) => s + (r.cadence === "weekly" ? r.amount : Math.round(r.amount / 4)), 0);
  const kids = simple.filter((m) => m.role === "child");
  return (
    <div className="rise">
      <PageHeader title="Allowances" sub="Paid automatically from the family pool. Split between spending, savings and a goal." action={<div className="flex gap-2"><DepositButton currency={c} variant="secondary" /><AllowanceButton currency={c} members={simple} goals={goals.filter((g) => g.status === "active").map((g) => ({ id: g.id, name: g.name, memberId: g.memberId }))} /></div>} />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14.5px] mb-8">
        <span className="text-ink-2">Family pool <strong className="text-ink tnum"><Money amount={pool.balance} currency={c} compact /></strong></span>
        {weeklyNeed > 0 && <span className="text-ink-2">Allowances need about <strong className="text-ink tnum"><Money amount={weeklyNeed} currency={c} compact /></strong> a week</span>}
      </div>
      {weeklyNeed > 0 && pool.balance < weeklyNeed && <div className="mb-6"><Notice tone="goal">The pool doesn&rsquo;t cover the next round of allowances. Payments will wait until it does.</Notice></div>}
      {!kids.length ? <EmptyState icon={<Wallet className="h-5 w-5" />} title="Add a child first" body="Allowances are set per child." /> : rules.length === 0 ? (
        <EmptyState icon={<Wallet className="h-5 w-5" />} title="A regular allowance teaches more than occasional cash" body="Choose an amount and a day, then decide how much goes straight to savings. Planned pays it on time, every time — and never twice." action={<AllowanceButton first currency={c} members={simple} goals={[]} />} />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rules.map((r) => (
            <li key={r.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-medium">{nameOf(r.memberId)} · <Money amount={r.amount} currency={c} compact /> {r.cadence} {!r.active && <Pill tone="neutral" className="ml-1">Paused</Pill>}</p>
                <p className="text-[13.5px] text-ink-3 mt-0.5">{r.cadence === "weekly" ? `Every ${WEEKDAYS[r.dayOfPeriod]}` : `On the ${r.dayOfPeriod}${["st", "nd", "rd"][r.dayOfPeriod - 1] ?? "th"}`} · {100 - r.savePercent - r.goalPercent}% spending, {r.savePercent}% savings{r.goalPercent ? `, ${r.goalPercent}% to ${goals.find((g) => g.id === r.goalId)?.name ?? "a goal"}` : ""} · {r.active ? `next ${relDate(r.nextDueAt)}` : "paused"}{r.lastPaidPeriod ? ` · last paid ${r.lastPaidPeriod}` : ""}</p>
              </div>
              <AllowanceRowActions id={r.id} active={r.active} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
