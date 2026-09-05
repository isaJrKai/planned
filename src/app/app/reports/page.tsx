import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { requireParent } from "@/lib/auth";
import { familyPulse } from "@/lib/insights";
import { listMembers, listGoals } from "@/lib/family";
import { PageHeader } from "@/components/app/Shell";
import { Money, Pill, SectionTitle } from "@/components/ui";
import { ExplainBox } from "@/components/app/Actions";

export const metadata = { title: "Reports" };

export default async function Reports() {
  const v = await requireParent();
  const c = v.family.currency;
  const now = new Date();
  const monthName = now.toLocaleDateString("en-GB", { month: "long" });
  const [pulse, members, goals] = await Promise.all([familyPulse(v.family.id), listMembers(v.family.id), listGoals(v.family.id)]);
  const kids = members.filter((m) => m.member.role === "child");
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const month = await db.select().from(transactions).where(and(eq(transactions.familyId, v.family.id), eq(transactions.status, "posted"), gte(transactions.createdAt, start)));
  const spends = month.filter((t) => t.kind === "spend");
  const byCat = Object.entries(spends.reduce<Record<string, number>>((m, t) => { m[t.category ?? "Other"] = (m[t.category ?? "Other"] ?? 0) + t.amount; return m; }, {})).sort((a, b) => b[1] - a[1]);
  const totalSpend = spends.reduce((s, t) => s + t.amount, 0);
  const worth = spends.filter((t) => (t.metadata as { worthIt?: string } | null)?.worthIt);
  const worthYes = worth.filter((t) => (t.metadata as { worthIt?: string }).worthIt === "yes").length;
  const perChild = kids.map((k) => {
    const mine = month.filter((t) => t.memberId === k.member.id);
    const allowance = mine.filter((t) => t.kind === "allowance" || (t.kind === "goal_contribution" && (t.metadata as { ruleId?: string } | null)?.ruleId)).reduce((s, t) => s + t.amount, 0);
    const saved = mine.filter((t) => t.kind === "goal_contribution" || (t.kind === "transfer" && (t.metadata as { toKind?: string } | null)?.toKind === "savings")).reduce((s, t) => s + t.amount, 0);
    const spent = mine.filter((t) => t.kind === "spend").reduce((s, t) => s + t.amount, 0);
    return { name: k.user.displayName, allowance, saved, spent };
  });
  const dp = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);
  const completedThisMonth = goals.filter((g) => g.status === "completed" && g.completedAt && g.completedAt >= start).length;
  const delta = (n: number | null) => n === null ? <span className="text-ink-3">— no comparison yet</span> : <span className={n >= 0 ? "text-save" : "text-spend"}>{n >= 0 ? "↑" : "↓"} {Math.abs(n)}% vs last month</span>;
  return (
    <div className="rise max-w-3xl">
      <PageHeader title={`${monthName} so far`} sub="Deterministic figures from the ledger. The month closes automatically." />
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-6 border-y border-line py-6">
        <div><dt className="text-[12.5px] text-ink-3 uppercase tracking-wide">Saved</dt><dd className="text-[22px] font-semibold tnum text-save mt-1"><Money amount={pulse.savedThisMonth} currency={c} compact /></dd><dd className="text-[12.5px]">{delta(dp(pulse.savedThisMonth, pulse.savedLastMonth))}</dd></div>
        <div><dt className="text-[12.5px] text-ink-3 uppercase tracking-wide">Spent</dt><dd className="text-[22px] font-semibold tnum text-spend mt-1"><Money amount={pulse.spentThisMonth} currency={c} compact /></dd><dd className="text-[12.5px]">{delta(dp(pulse.spentThisMonth, pulse.spentLastMonth))}</dd></div>
        <div><dt className="text-[12.5px] text-ink-3 uppercase tracking-wide">Goals reached</dt><dd className="text-[22px] font-semibold tnum mt-1">{completedThisMonth}</dd></div>
        <div><dt className="text-[12.5px] text-ink-3 uppercase tracking-wide">Children who saved</dt><dd className="text-[22px] font-semibold tnum mt-1">{pulse.childrenSaving}/{pulse.childrenTotal}</dd></div>
      </dl>
      <div className="mt-4 flex items-center gap-2 text-[14.5px]">Family financial health <Pill tone={pulse.label === "Needs attention" ? "spend" : pulse.label === "Steady" ? "goal" : "save"}>{pulse.label}</Pill></div>
      {pulse.notes.length > 0 && <ul className="mt-3 space-y-1 text-[15px] text-ink-2 list-disc pl-5">{pulse.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
      <ExplainBox topic="pulse" question="Summarise this month for a parent in a few sentences, and suggest one conversation to have with the children." prompt="Write this up for me" />

      <section className="mt-12">
        <SectionTitle title="What happened to each allowance" sub="Behaviour, not just balances" />
        {perChild.length ? (
          <div className="divide-y divide-line">
            {perChild.map((p) => {
              const total = Math.max(1, p.saved + p.spent);
              return (
                <div key={p.name} className="py-4">
                  <div className="flex justify-between text-[15px]"><span className="font-medium">{p.name}</span><span className="text-ink-2 tnum">received <Money amount={p.allowance} currency={c} compact /></span></div>
                  <div className="mt-2 h-2.5 rounded-full bg-warm-2 overflow-hidden flex"><div className="bg-save h-full" style={{ width: `${(p.saved / total) * 100}%` }} /><div className="bg-spend h-full" style={{ width: `${(p.spent / total) * 100}%` }} /></div>
                  <p className="text-[13.5px] text-ink-3 mt-1.5"><span className="text-save font-medium">Saved <Money amount={p.saved} currency={c} compact /></span> · <span className="text-spend font-medium">Spent <Money amount={p.spent} currency={c} compact /></span>{p.allowance > 0 && <> · saving rate {Math.round((p.saved / Math.max(1, p.saved + p.spent)) * 100)}%</>}</p>
                </div>
              );
            })}
          </div>
        ) : <p className="text-ink-3 text-[14.5px]">Add children to see this.</p>}
      </section>

      <section className="mt-12">
        <SectionTitle title="Spending by category" />
        {byCat.length ? (
          <ul className="space-y-3">{byCat.map(([cat, amt]) => <li key={cat}><div className="flex justify-between text-[14.5px] mb-1"><span>{cat}</span><span className="tnum text-ink-2"><Money amount={amt} currency={c} compact /> · {Math.round((amt / totalSpend) * 100)}%</span></div><div className="h-1.5 rounded-full bg-warm-2"><div className="h-full bg-spend rounded-full" style={{ width: `${(amt / totalSpend) * 100}%` }} /></div></li>)}</ul>
        ) : <p className="text-ink-3 text-[14.5px]">No spending recorded this month.</p>}
        {worth.length > 0 && <p className="mt-4 text-[14.5px] text-ink-2">Of {worth.length} purchases the children reflected on, they marked <strong className="text-ink">{Math.round((worthYes / worth.length) * 100)}%</strong> as worth it.</p>}
      </section>
    </div>
  );
}
