import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { lessonCompletions, transactions, approvalRequests } from "@/db/schema";
import { requireViewer } from "@/lib/auth";
import { memberAccounts, listGoals, listAllowanceRules, getRules } from "@/lib/family";
import { forecastGoal } from "@/lib/goals";
import { LESSONS, levelUnlocked } from "@/lib/lessons";
import { Money, Progress, Pill } from "@/components/ui";
import { GoalButton, ContributeButton } from "@/components/app/Actions";
import { SpendButton, RequestMoneyButton } from "@/components/me/Actions";
import { pct, formatMoney } from "@/lib/money";
import { timeOfDay, firstName, relDate, longDate } from "@/lib/format";

export default async function ChildHome() {
  const v = await requireViewer();
  const c = v.family.currency; const me = v.member.id;
  const [accts, goals, rules, famRules, done, saves, pending] = await Promise.all([
    memberAccounts(v.family.id, me), listGoals(v.family.id, me), listAllowanceRules(v.family.id, me), getRules(v.family.id),
    db.select().from(lessonCompletions).where(eq(lessonCompletions.memberId, me)),
    db.select().from(transactions).where(and(eq(transactions.memberId, me), eq(transactions.kind, "goal_contribution"), eq(transactions.status, "posted"))),
    db.select().from(approvalRequests).where(and(eq(approvalRequests.memberId, me), eq(approvalRequests.status, "pending"))),
  ]);
  const active = goals.filter((g) => g.status === "active");
  const main = active.sort((a, b) => pct(b.saved, b.targetAmount) - pct(a.saved, a.targetAmount))[0];
  const totalSaved = accts.savings.balance + accts.goalAccounts.reduce((s, a) => s + a.balance, 0);
  const streak = forecastGoal(1, 0, saves).consistentWeeks;
  const doneSet = new Set(done.map((d) => d.lessonSlug));
  const nextLesson = LESSONS.find((l) => !doneSet.has(l.slug) && levelUnlocked(l.level, doneSet));
  const allowance = rules.find((r) => r.active);
  const mainForecast = main ? forecastGoal(main.targetAmount, main.saved, saves.filter((s) => s.goalId === main.id)) : null;
  const simple = [{ id: me, name: v.user.displayName, role: "child" }];
  const weekAgo = Date.now() - 7 * 86400000;
  const savedThisWeek = saves.filter((s) => s.createdAt.getTime() > weekAgo).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="rise">
      <p className="text-ink-3 text-[15px]">{timeOfDay()}, {firstName(v.user.displayName)}</p>
      <h1 className="text-[30px] sm:text-[36px] font-semibold leading-tight mt-1 max-w-2xl">
        {totalSaved > 0 ? <>You&rsquo;ve saved <span className="text-save"><Money amount={totalSaved} currency={c} /></span> altogether.</> : <>Your money story starts today.</>}
      </h1>
      <p className="text-ink-2 mt-2 text-[16px] max-w-xl">
        {savedThisWeek > 0 ? <>{formatMoney(savedThisWeek, c)} of that was this week. </> : null}
        {streak >= 2 ? <>{streak} weeks of saving in a row — that&rsquo;s a habit now.</> : streak === 1 ? <>You saved this week. Do it again next week and it starts to become a habit.</> : <>Saving something small every week is how goals get reached.</>}
      </p>
      <div className="mt-6 flex flex-wrap gap-2"><SpendButton memberId={me} currency={c} spendingBalance={accts.spending.balance} approvalThreshold={famRules.approvalThreshold} /><RequestMoneyButton currency={c} /></div>
      {pending.length > 0 && <p className="mt-3 text-[14px] text-goal">{pending.length === 1 ? "One request is" : `${pending.length} requests are`} waiting for a parent&rsquo;s answer.</p>}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-12">
          <section>
            <div className="flex items-baseline justify-between mb-3"><h2 className="text-[19px] font-semibold">{main ? "Your goal" : "A goal"}</h2>{active.length > 1 && <Link href="/me/goals" className="text-[14px] text-brand font-medium hover:underline">All {active.length} goals</Link>}</div>
            {main ? (
              <div className="border border-line rounded-lg p-5 sm:p-6">
                <Link href={`/me/goals/${main.id}`} className="text-[22px] font-semibold hover:underline underline-offset-2">{main.name}</Link>
                <p className="text-[28px] font-semibold tnum mt-3 leading-none"><Money amount={main.saved} currency={c} /> <span className="text-[15px] font-normal text-ink-3">of <Money amount={main.targetAmount} currency={c} compact /></span></p>
                <div className="flex items-center gap-3 mt-4"><Progress value={pct(main.saved, main.targetAmount)} tone={pct(main.saved, main.targetAmount) >= 80 ? "save" : "goal"} className="h-3" /><span className="tnum font-medium w-12 text-right">{pct(main.saved, main.targetAmount)}%</span></div>
                <p className="mt-3 text-[15px] text-ink-2">{pct(main.saved, main.targetAmount) >= 100 ? "You did it." : main.saved > 0 ? <>You&rsquo;re closer than you were yesterday.{mainForecast?.estimatedDate ? <> At this pace: <strong className="text-ink">{longDate(mainForecast.estimatedDate)}</strong>.</> : null}</> : "First contribution starts the clock."}</p>
                <div className="mt-5 pt-5 border-t border-line">
                  <p className="text-[13px] font-medium text-ink-3 uppercase tracking-wide mb-2">Ways to get there</p>
                  <ul className="space-y-2 text-[14.5px]">
                    {allowance && <li className="flex justify-between"><span>Next allowance{allowance.goalPercent && allowance.goalId === main.id ? ` (${allowance.goalPercent}% goes here automatically)` : ""}</span><span className="tnum text-ink-2">{formatMoney(allowance.amount, c)} · {relDate(allowance.nextDueAt)}</span></li>}
                    <li className="flex justify-between"><span>Move from spending</span><span className="tnum text-ink-2">{formatMoney(accts.spending.balance, c)} available</span></li>
                    {nextLesson && <li className="flex justify-between"><Link href={`/me/learn/${nextLesson.slug}`} className="hover:underline">Finish &ldquo;{nextLesson.title}&rdquo;</Link><span className="text-ink-2">{nextLesson.minutes} min</span></li>}
                  </ul>
                  <div className="mt-4"><ContributeButton goalId={main.id} goalName={main.name} currency={c} sources={[{ key: "spending", label: "Spending", balance: accts.spending.balance }, { key: "savings", label: "Savings", balance: accts.savings.balance }]} /></div>
                </div>
              </div>
            ) : (
              <div className="border border-line rounded-lg p-6 bg-warm">
                <h3 className="text-[19px] font-semibold">Your first goal starts here.</h3>
                <p className="text-ink-2 mt-1 text-[15px]">Choose something you&rsquo;re saving for and we&rsquo;ll help you get there — and tell you when.</p>
                <div className="mt-4"><GoalButton first childMode currency={c} members={simple} forMemberId={me} /></div>
              </div>
            )}
          </section>
        </div>
        <div className="space-y-10">
          <section>
            <h2 className="text-[19px] font-semibold mb-3">Your money</h2>
            <dl className="space-y-2.5 text-[15px]">
              <div className="flex justify-between"><dt className="text-ink-2">To spend</dt><dd className="tnum font-medium"><Money amount={accts.spending.balance} currency={c} compact /></dd></div>
              <div className="flex justify-between"><dt className="text-ink-2">Savings</dt><dd className="tnum font-medium text-save"><Money amount={accts.savings.balance} currency={c} compact /></dd></div>
              <div className="flex justify-between"><dt className="text-ink-2">In goals</dt><dd className="tnum font-medium text-goal"><Money amount={accts.goalAccounts.reduce((s, a) => s + a.balance, 0)} currency={c} compact /></dd></div>
            </dl>
            <Link href="/me/money" className="inline-flex items-center gap-1 mt-3 text-[14px] font-medium text-brand hover:underline">See everything<ArrowRight className="h-3.5 w-3.5" /></Link>
          </section>
          <section>
            <h2 className="text-[19px] font-semibold mb-3">Keep learning</h2>
            {nextLesson ? (
              <Link href={`/me/learn/${nextLesson.slug}`} className="block border border-line rounded-lg p-4 hover:bg-warm">
                <Pill tone="grow">Level {nextLesson.level}</Pill>
                <p className="font-medium mt-2">{nextLesson.title}</p>
                <p className="text-[14px] text-ink-2 mt-0.5">{nextLesson.summary}</p>
                <p className="text-[13px] text-ink-3 mt-2">{nextLesson.minutes} min · {done.length} of {LESSONS.length} done</p>
              </Link>
            ) : <p className="text-[14.5px] text-ink-2">You&rsquo;ve finished every lesson. That&rsquo;s rare.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
