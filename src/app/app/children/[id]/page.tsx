import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { lessonCompletions, memberAchievements, journalEntries } from "@/db/schema";
import { requireParent, requireFamilyMember } from "@/lib/auth";
import { memberAccounts, listGoals, listTransactions, listAllowanceRules, accountNameMap, listMembers } from "@/lib/family";
import { forecastGoal } from "@/lib/goals";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { LESSONS } from "@/lib/lessons";
import { Money, SectionTitle, EmptyState, Pill } from "@/components/ui";
import { GoalRow, TxnList } from "@/components/app/Shared";
import { GiveButton, ResetChildPassword, GoalButton, ReverseButton } from "@/components/app/Actions";
import { relDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";

export default async function ChildPage({ params }: { params: Promise<{ id: string }> }) {
  const v = await requireParent();
  const { id } = await params;
  let m; try { m = await requireFamilyMember(v, id); } catch { notFound(); }
  if (m.role !== "child") notFound();
  const c = v.family.currency;
  const [accts, goals, txns, rules, names, members, lessons, badges, journal] = await Promise.all([
    memberAccounts(v.family.id, m.id), listGoals(v.family.id, m.id), listTransactions(v.family.id, { memberId: m.id, limit: 12 }), listAllowanceRules(v.family.id, m.id), accountNameMap(v.family.id), listMembers(v.family.id),
    db.select().from(lessonCompletions).where(eq(lessonCompletions.memberId, m.id)),
    db.select().from(memberAchievements).where(eq(memberAchievements.memberId, m.id)),
    db.select().from(journalEntries).where(eq(journalEntries.memberId, m.id)).orderBy(desc(journalEntries.createdAt)).limit(3),
  ]);
  const me = members.find((x) => x.member.id === m.id)!;
  const goalTotal = accts.goalAccounts.reduce((s, a) => s + a.balance, 0);
  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");
  const saves = txns.filter((t) => t.kind === "goal_contribution");
  const streak = forecastGoal(1, 0, saves).consistentWeeks;
  const memberNames = { [m.id]: me.user.displayName };
  const simple = [{ id: m.id, name: me.user.displayName, role: "child" }];
  return (
    <div className="rise">
      <Link href="/app/children" className="text-[14px] text-ink-3 hover:text-ink">← Children</Link>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2 mb-8">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight">{me.user.displayName}</h1>
          <p className="text-ink-2 mt-1">@{me.user.username}{m.birthYear ? ` · ${new Date().getFullYear() - m.birthYear} years old` : ""}</p>
        </div>
        <div className="flex gap-2 flex-wrap"><GiveButton currency={c} members={simple} memberId={m.id} /><GoalButton currency={c} members={simple} forMemberId={m.id} /><ResetChildPassword memberId={m.id} name={me.user.displayName} /></div>
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-8 border-y border-line py-6">
        <div><p className="text-[12.5px] text-ink-3 uppercase tracking-wide">Spending</p><p className="text-[22px] font-semibold tnum mt-1"><Money amount={accts.spending.balance} currency={c} compact /></p></div>
        <div><p className="text-[12.5px] text-ink-3 uppercase tracking-wide">Savings</p><p className="text-[22px] font-semibold tnum mt-1 text-save"><Money amount={accts.savings.balance} currency={c} compact /></p></div>
        <div><p className="text-[12.5px] text-ink-3 uppercase tracking-wide">In goals</p><p className="text-[22px] font-semibold tnum mt-1 text-goal"><Money amount={goalTotal} currency={c} compact /></p></div>
        <div><p className="text-[12.5px] text-ink-3 uppercase tracking-wide">Saving streak</p><p className="text-[22px] font-semibold tnum mt-1">{streak} {streak === 1 ? "week" : "weeks"}</p></div>
      </section>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-10">
          <section>
            <SectionTitle title="Goals" sub={`${active.length} active · ${completed.length} reached`} />
            {goals.length ? <div className="divide-y divide-line">{goals.slice(0, 6).map((g) => <GoalRow key={g.id} goal={g} currency={c} href={`/app/goals/${g.id}`} />)}</div> : <EmptyState title="No goals yet" body={`${me.user.displayName} can create one from their own view, or you can start one now.`} />}
          </section>
          <section>
            <SectionTitle title="Recent activity" action={<Link href={`/app/transactions?memberId=${m.id}`} className="text-[14px] text-brand font-medium hover:underline">All</Link>} />
            {txns.length ? <TxnList rows={txns} currency={c} accounts={names} memberNames={memberNames} action={(t) => <ReverseButton id={t.id} />} /> : <EmptyState title="No activity yet" body="Allowances, spending and saving will show up here." />}
          </section>
        </div>
        <div className="space-y-10">
          <section>
            <SectionTitle title="Allowance" />
            {rules.length ? rules.map((r) => <p key={r.id} className="text-[15px]">{formatMoney(r.amount, c)} {r.cadence} {r.active ? "" : "(paused)"}<span className="block text-[13px] text-ink-3">{r.savePercent}% to savings{r.goalPercent ? `, ${r.goalPercent}% to a goal` : ""} · next {relDate(r.nextDueAt)}</span></p>) : <p className="text-[14.5px] text-ink-3">No allowance yet. <Link href="/app/allowances" className="text-brand font-medium hover:underline">Set one up</Link>.</p>}
          </section>
          <section>
            <SectionTitle title="Learning" sub={`${lessons.length} of ${LESSONS.length} lessons`} />
            <div className="h-2 rounded-full bg-warm-2 overflow-hidden"><div className="h-full bg-grow rounded-full" style={{ width: `${(lessons.length / LESSONS.length) * 100}%` }} /></div>
            {badges.length > 0 && <div className="flex flex-wrap gap-1.5 mt-4">{badges.map((b) => <Pill key={b.key} tone="grow">{ACHIEVEMENTS.find((a) => a.key === b.key)?.title ?? b.key}</Pill>)}</div>}
          </section>
          <section>
            <SectionTitle title="Journal" sub="Entries they chose to share" />
            {journal.filter((j) => j.visibleToParents).length ? <ul className="space-y-3">{journal.filter((j) => j.visibleToParents).map((j) => <li key={j.id} className="text-[14.5px] border-l-2 border-line-strong pl-3"><p className="text-ink-2">{j.body}</p><p className="text-[12.5px] text-ink-3 mt-1">{relDate(j.createdAt)}</p></li>)}</ul> : <p className="text-[14.5px] text-ink-3">Nothing shared yet.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
