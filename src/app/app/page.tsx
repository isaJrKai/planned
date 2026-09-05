import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireParent } from "@/lib/auth";
import { familyPulse, whatsHappening, nextMoves } from "@/lib/insights";
import { listGoals, listMembers, familyPool } from "@/lib/family";
import { timeOfDay, firstName, relDate } from "@/lib/format";
import { Money, Pill, EmptyState } from "@/components/ui";
import { GoalRow } from "@/components/app/Shared";
import { ExplainBox, AddChildButton, DepositButton } from "@/components/app/Actions";

export default async function Overview() {
  const v = await requireParent();
  const fid = v.family.id;
  const [pulse, happening, moves, goals, members, pool] = await Promise.all([familyPulse(fid), whatsHappening(fid), nextMoves(fid), listGoals(fid), listMembers(fid), familyPool(fid)]);
  const c = v.family.currency;
  const nameOf = (id: string | null) => members.find((m) => m.member.id === id)?.user.displayName;
  const children = members.filter((m) => m.member.role === "child");
  const active = goals.filter((g) => g.status === "active").slice(0, 5);
  const delta = pulse.savedLastMonth > 0 ? Math.round(((pulse.savedThisMonth - pulse.savedLastMonth) / pulse.savedLastMonth) * 100) : null;
  const toneFor = { Strong: "save", Good: "save", Steady: "goal", "Needs attention": "spend" } as const;

  return (
    <div className="rise">
      <p className="text-ink-3 text-[15px]">{timeOfDay()}, {firstName(v.user.displayName)}</p>
      {children.length === 0 ? (
        <>
          <h1 className="text-[30px] sm:text-[36px] font-semibold leading-tight mt-1 max-w-2xl">Welcome to {v.family.name}. Let&rsquo;s add your first child.</h1>
          <p className="text-ink-2 mt-2 max-w-xl text-[16px]">Each child gets their own sign-in, a spending account and a savings account. Then you can set an allowance and they can create their first goal.</p>
          <div className="mt-6 flex flex-wrap gap-2"><AddChildButton first /><DepositButton currency={c} variant="secondary" /></div>
        </>
      ) : (
        <>
          <h1 className="text-[30px] sm:text-[36px] font-semibold leading-tight mt-1 max-w-2xl">
            {pulse.savedThisMonth > 0 ? <>Your family saved <span className="text-save"><Money amount={pulse.savedThisMonth} currency={c} /></span> this month.</> : <>Nothing saved yet this month — the month is young.</>}
          </h1>
          <p className="text-ink-2 mt-2 text-[16px] max-w-xl">
            {delta !== null && pulse.savedThisMonth > 0 ? <>That&rsquo;s {Math.abs(delta)}% {delta >= 0 ? "more" : "less"} than last month. </> : null}
            {pulse.notes.filter((n) => !n.startsWith("Savings are")).slice(0, 2).join(" ")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
            <span className="inline-flex items-center gap-2">Family financial health <Pill tone={toneFor[pulse.label]}>{pulse.label}</Pill></span>
            <span className="text-ink-2">Total savings <strong className="text-ink tnum"><Money amount={pulse.totalSavings} currency={c} compact /></strong></span>
            <span className="text-ink-2">Family pool <strong className="text-ink tnum"><Money amount={pool.balance} currency={c} compact /></strong></span>
          </div>
          <ExplainBox topic="pulse" question="In plain words, how is this family doing with money this month, and what is one thing worth talking about?" prompt="What's behind this?" />
        </>
      )}

      {children.length > 0 && (
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <section aria-labelledby="progress">
            <div className="flex items-baseline justify-between mb-1"><h2 id="progress" className="text-[19px] font-semibold">Family progress</h2><Link href="/app/goals" className="text-[14px] text-brand font-medium hover:underline">All goals</Link></div>
            {active.length ? (
              <div className="divide-y divide-line">{active.map((g) => <GoalRow key={g.id} goal={g} currency={c} href={`/app/goals/${g.id}`} owner={g.isShared ? "Family" : nameOf(g.memberId)} />)}</div>
            ) : (
              <EmptyState title="No goals yet" body="Goals are where saving becomes visible. Children can create their own, or you can start one for them." action={<Link href="/app/goals" className="text-brand font-medium text-[14.5px] hover:underline">Go to goals</Link>} />
            )}
            <div className="mt-8">
              <h3 className="text-[15px] font-semibold text-ink-2 mb-3">Children</h3>
              <ul className="grid sm:grid-cols-2 gap-3">
                {children.map((ch) => (
                  <li key={ch.member.id}><Link href={`/app/children/${ch.member.id}`} className="flex items-center justify-between border border-line rounded-md px-4 py-3 hover:bg-warm"><span className="font-medium">{ch.user.displayName}</span><ArrowRight className="h-4 w-4 text-ink-3" /></Link></li>
                ))}
              </ul>
            </div>
          </section>

          <div className="space-y-10">
            <section aria-labelledby="happening">
              <h2 id="happening" className="text-[19px] font-semibold mb-3">What&rsquo;s happening</h2>
              {happening.length ? (
                <ul className="space-y-3">
                  {happening.map((h) => (
                    <li key={h.id} className="flex gap-3 text-[14.5px]">
                      <span className={`mt-2 h-1.5 w-1.5 rounded-full shrink-0 ${{ green: "bg-save", amber: "bg-goal", blue: "bg-brand", red: "bg-spend", purple: "bg-grow", neutral: "bg-ink-3" }[h.tone]}`} />
                      <span className="flex-1">{h.href ? <Link href={h.href} className="hover:underline underline-offset-2">{h.text}</Link> : h.text}<span className="block text-[12.5px] text-ink-3">{relDate(h.at)}</span></span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-[14.5px] text-ink-3">Quiet so far. Activity from allowances, goals and lessons will show up here.</p>}
            </section>

            <section aria-labelledby="next">
              <h2 id="next" className="text-[19px] font-semibold mb-3">Your next move</h2>
              <div className="space-y-3">
                {moves.map((m) => (
                  <div key={m.title} className="border border-line rounded-lg p-4 bg-warm">
                    <p className="font-medium text-[15px]">{m.title}</p>
                    <p className="text-[14px] text-ink-2 mt-1">{m.body}</p>
                    <Link href={m.href} className="inline-flex items-center gap-1 mt-3 text-[14px] font-medium text-brand hover:underline">{m.cta}<ArrowRight className="h-3.5 w-3.5" /></Link>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
