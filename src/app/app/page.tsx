import Link from "next/link";
import { and, eq, gte } from "drizzle-orm";
import { ArrowRight, Sparkles, Activity as ActivityIcon, Wallet } from "lucide-react";
import { requireParent } from "@/lib/auth";
import { familyPulse, whatsHappening, nextMoves } from "@/lib/insights";
import { listGoals, listMembers, familyPool } from "@/lib/family";
import { timeOfDay, firstName, relDate } from "@/lib/format";
import { Money, Pill, Card, Stat } from "@/components/ui";
import { GoalRow } from "@/components/app/Shared";
import { ExplainBox, AddChildButton, DepositButton } from "@/components/app/Actions";
import { HealthGauge } from "@/components/charts/HealthGauge";
import { TrendChart } from "@/components/charts/TrendChart";
import { SpendingDonut, DonutLegend } from "@/components/charts/SpendingDonut";
import { ProgressRing, type RingTone } from "@/components/charts/ProgressRing";
import { Sparkline } from "@/components/charts/Sparkline";
import { db } from "@/db";
import { transactions, accounts } from "@/db/schema";
import { pct } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const v = await requireParent();
  const fid = v.family.id;
  const c = v.family.currency;
  const [pulse, happening, moves, goals, members, pool] = await Promise.all([
    familyPulse(fid),
    whatsHappening(fid),
    nextMoves(fid),
    listGoals(fid),
    listMembers(fid),
    familyPool(fid),
  ]);

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Single query for the past 6 months of posted transactions.
  const recentTxns = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.familyId, fid), eq(transactions.status, "posted"), gte(transactions.createdAt, sixMonthsAgo)));
  const acctRows = await db.select().from(accounts).where(eq(accounts.familyId, fid));
  const savingsIds = new Set(acctRows.filter((a) => a.kind === "savings" || a.kind === "goal").map((a) => a.id));
  const isSaving = (t: (typeof recentTxns)[number]) =>
    !!t.toAccountId && savingsIds.has(t.toAccountId) && !(t.fromAccountId && savingsIds.has(t.fromAccountId));

  // 6-month savings trend (per calendar month).
  const trend: { month: string; amount: number }[] = [];
  let streak = 0;
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const amount = recentTxns
      .filter((t) => isSaving(t) && t.createdAt >= start && t.createdAt < end)
      .reduce((s, t) => s + t.amount, 0);
    trend.push({ month: start.toLocaleDateString("en-US", { month: "short" }), amount });
  }
  // Streak = trailing months (most-recent first) with positive savings.
  for (let i = trend.length - 1; i >= 0; i--) {
    if (trend[i].amount > 0) streak++;
    else break;
  }

  // Spending by category (this month).
  const spends = recentTxns.filter((t) => t.kind === "spend" && t.createdAt >= monthStart);
  const totalSpend = spends.reduce((s, t) => s + t.amount, 0);
  const byCat = spends.reduce<Record<string, number>>((m, t) => {
    const cat = t.category ?? "Other";
    m[cat] = (m[cat] ?? 0) + t.amount;
    return m;
  }, {});
  const palette = ["#2563eb", "#0d9488", "#d97706", "#7c3aed", "#dc2626", "#475569"];
  const spending = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, amount], i) => ({ label, amount, color: palette[i % palette.length] }));

  // Per-child derived metrics.
  const children = members.filter((m) => m.member.role === "child");
  const childCards = children.map((ch) => {
    const chGoals = goals.filter((g) => g.memberId === ch.member.id && g.status === "active");
    const totalSaved = chGoals.reduce((s, g) => s + g.saved, 0);
    const totalTarget = chGoals.reduce((s, g) => s + g.targetAmount, 0);
    const progress = pct(totalSaved, totalTarget);
    const spark: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const amt = recentTxns
        .filter((t) => t.memberId === ch.member.id && t.kind === "goal_contribution" && t.createdAt >= start && t.createdAt < end)
        .reduce((s, t) => s + t.amount, 0);
      spark.push(amt);
    }
    const lastContribution =
      recentTxns
        .filter((t) => t.memberId === ch.member.id && t.kind === "goal_contribution")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt ?? null;
    return { child: ch, goals: chGoals, totalSaved, totalTarget, progress, spark, lastContribution };
  });

  const nameOf = (id: string | null) => members.find((m) => m.member.id === id)?.user.displayName;
  const active = goals.filter((g) => g.status === "active").slice(0, 4);
  const delta = pulse.savedLastMonth > 0 ? Math.round(((pulse.savedThisMonth - pulse.savedLastMonth) / pulse.savedLastMonth) * 100) : null;
  const toneFor = { Strong: "save", Good: "save", Steady: "goal", "Needs attention": "spend" } as const;
  const hasSavingsData = trend.some((t) => t.amount > 0);
  const weeklyAvg = pulse.savedThisMonth > 0 ? Math.round(pulse.savedThisMonth / 4.33) : 0;

  // ---- Empty state: no children yet → onboarding ----
  if (children.length === 0) {
    return (
      <div className="rise">
        <p className="text-ink-3 text-[15px]">{timeOfDay()}, {firstName(v.user.displayName)}</p>
        <h1 className="text-[30px] sm:text-[36px] font-semibold leading-tight mt-1 max-w-2xl">
          Welcome to {v.family.name}. Let&rsquo;s add your first child.
        </h1>
        <p className="text-ink-2 mt-2 max-w-xl text-[16px]">
          Each child gets their own sign-in, a spending account and a savings account. Then you can set an allowance and they can create their first goal.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <AddChildButton first />
          <DepositButton currency={c} variant="secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="rise space-y-5">
      {/* ---- Page header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-ink-3 text-[14px] font-medium">{timeOfDay()}, {firstName(v.user.displayName)}</p>
          <h1 className="text-[26px] sm:text-[30px] font-semibold leading-tight mt-1 max-w-2xl tracking-tight">
            {pulse.savedThisMonth > 0 ? (
              <>
                Your family saved <span className="text-brand"><Money amount={pulse.savedThisMonth} currency={c} /></span> this month.
              </>
            ) : (
              <>Nothing saved yet this month — the month is young.</>
            )}
          </h1>
          <p className="text-ink-2 mt-1.5 text-[14px] max-w-xl">
            {delta !== null && pulse.savedThisMonth > 0 ? (
              <>That&rsquo;s {Math.abs(delta)}% {delta >= 0 ? "more" : "less"} than last month. </>
            ) : null}
            Family pool <span className="tnum font-medium text-ink"><Money amount={pool.balance} currency={c} compact /></span>.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <DepositButton currency={c} variant="secondary" label="Add to pool" />
          <AddChildButton />
        </div>
      </div>

      {/* ---- Top row: Health gauge + AI insight ---- */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card padded className="lg:col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[14px] font-semibold text-ink-2">Family health</h2>
            <Pill tone={toneFor[pulse.label]}>{pulse.label}</Pill>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <HealthGauge
              score={pulse.score}
              label={pulse.label}
              sublabel={`${pulse.activeGoals} active ${pulse.activeGoals === 1 ? "goal" : "goals"} · ${pulse.childrenSaving}/${pulse.childrenTotal} children saving`}
            />
          </div>
        </Card>

        <Card padded className="lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-8 w-8 rounded-md bg-brand-soft text-brand grid place-items-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold leading-tight">AI Coach</h2>
              <p className="text-[12.5px] text-ink-3">This month, in plain words</p>
            </div>
          </div>
          <div className="text-[14.5px] text-ink-2 leading-relaxed space-y-2">
            {pulse.savedThisMonth > 0 ? (
              <>
                <p>
                  Weekly savings: <span className="font-semibold text-ink tnum"><Money amount={weeklyAvg} currency={c} /></span>.
                  {streak > 0 && <> Streak: {streak} {streak === 1 ? "month" : "months"}.</>}
                </p>
                {pulse.childrenTotal > 0 && (
                  <p>
                    {pulse.childrenSaving} of {pulse.childrenTotal} {pulse.childrenTotal === 1 ? "child has" : "children have"} put money toward a goal this month.
                  </p>
                )}
                {pulse.pending > 0 && (
                  <p>
                    {pulse.pending} {pulse.pending === 1 ? "request is" : "requests are"} waiting for your review.
                  </p>
                )}
              </>
            ) : (
              <p>No savings recorded this month yet. A small first contribution from any child starts the streak.</p>
            )}
          </div>
          <div className="mt-auto pt-4">
            <ExplainBox
              topic="pulse"
              question="In plain words, how is this family doing with money this month, and what is one thing worth talking about?"
              prompt="What's behind this?"
            />
          </div>
        </Card>
      </div>

      {/* ---- Second row: Trend chart + Spending donut ---- */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card padded className="lg:col-span-2">
          <div className="flex items-start justify-between mb-3 gap-4">
            <div>
              <h2 className="text-[15px] font-semibold">Savings trend</h2>
              <p className="text-[12.5px] text-ink-3 mt-0.5">Last 6 months · total saved per month</p>
            </div>
            <Stat
              value={<Money amount={pulse.savedThisMonth} currency={c} compact />}
              label="This month"
              delta={delta ?? undefined}
              deltaLabel="vs last"
              tone="save"
              className="text-right"
            />
          </div>
          {hasSavingsData ? (
            <TrendChart data={trend} currency={c} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[13.5px] text-ink-3 text-center">
              No savings recorded in the last 6 months.
            </div>
          )}
        </Card>

        <Card padded className="lg:col-span-1">
          <div className="mb-3">
            <h2 className="text-[15px] font-semibold">Spending</h2>
            <p className="text-[12.5px] text-ink-3 mt-0.5">By category · this month</p>
          </div>
          {spending.length > 0 ? (
            <div className="flex flex-col items-center">
              <SpendingDonut
                data={spending}
                size={160}
                centerValue={c}
                centerLabel={`${totalSpend >= 1000 ? `${Math.round(totalSpend / 1000)}K` : totalSpend.toLocaleString()} spent`}
              />
              <div className="mt-4 w-full">
                <DonutLegend data={spending} total={totalSpend} currency={c} />
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-[13.5px] text-ink-3 text-center">
              No spending recorded this month.
            </div>
          )}
        </Card>
      </div>

      {/* ---- Third row: Children cards ---- */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[17px] font-semibold">Children</h2>
          <Link href="/app/children" className="text-[13.5px] text-brand font-medium hover:underline">All children</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {childCards.map(({ child, goals: chGoals, totalSaved, totalTarget, progress, spark, lastContribution }) => {
            const initials = child.user.displayName
              .split(" ")
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();
            const ringTone: RingTone = progress >= 80 ? "save" : progress >= 40 ? "brand" : "goal";
            return (
              <Card key={child.member.id} hover as="article" className="p-5">
                <Link href={`/app/children/${child.member.id}`} className="block">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-brand-soft text-brand grid place-items-center text-[13px] font-semibold shrink-0">
                        {initials || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[15px] truncate">{child.user.displayName}</p>
                        <p className="text-[12.5px] text-ink-3">{chGoals.length} active {chGoals.length === 1 ? "goal" : "goals"}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-ink-3 shrink-0 mt-1" />
                  </div>

                  {/* Amount + sparkline */}
                  <div className="flex items-end justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="text-[11.5px] uppercase tracking-wide text-ink-3 font-medium">Saved toward goals</p>
                      <p className="text-[22px] font-semibold tnum mt-1 leading-none truncate">
                        {totalSaved > 0 ? <Money amount={totalSaved} currency={c} compact /> : <span className="text-ink-3">—</span>}
                      </p>
                    </div>
                    <Sparkline data={spark} width={72} height={28} tone="accent" />
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-3 pt-3 border-t border-line">
                    <ProgressRing value={progress} size={48} tone={ringTone} showValue />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] text-ink-2">
                        {totalTarget > 0 ? (
                          <>
                            of <span className="tnum font-medium text-ink"><Money amount={totalTarget} currency={c} compact /></span>
                          </>
                        ) : (
                          "No target set"
                        )}
                      </p>
                      <p className="text-[12px] text-ink-3 mt-0.5">
                        {lastContribution ? `Last saved ${relDate(lastContribution)}` : "No contributions yet"}
                      </p>
                    </div>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ---- Active goals (compact) ---- */}
      {active.length > 0 && (
        <Card padded>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[15px] font-semibold">Active goals</h2>
            <Link href="/app/goals" className="text-[13.5px] text-brand font-medium hover:underline">All goals</Link>
          </div>
          <div className="divide-y divide-line">
            {active.map((g) => (
              <GoalRow key={g.id} goal={g} currency={c} href={`/app/goals/${g.id}`} owner={g.isShared ? "Family" : nameOf(g.memberId)} />
            ))}
          </div>
        </Card>
      )}

      {/* ---- Bottom: Activity + Next moves ---- */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card padded>
          <div className="flex items-center gap-2 mb-4">
            <ActivityIcon className="h-4 w-4 text-ink-3" />
            <h2 className="text-[15px] font-semibold">Activity</h2>
          </div>
          {happening.length ? (
            <ul className="space-y-3">
              {happening.map((h) => (
                <li key={h.id} className="flex gap-3 text-[14px]">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                      {
                        green: "bg-save",
                        amber: "bg-goal",
                        blue: "bg-brand",
                        red: "bg-spend",
                        purple: "bg-grow",
                        neutral: "bg-ink-3",
                      }[h.tone]
                    }`}
                    aria-hidden
                  />
                  <span className="flex-1 min-w-0">
                    {h.href ? (
                      <Link href={h.href} className="hover:underline underline-offset-2">{h.text}</Link>
                    ) : (
                      h.text
                    )}
                    <span className="block text-[12px] text-ink-3 mt-0.5">{relDate(h.at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-ink-3">Quiet so far. Activity from allowances, goals and lessons will show up here.</p>
          )}
        </Card>

        <Card padded>
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-4 w-4 text-ink-3" />
            <h2 className="text-[15px] font-semibold">Next moves</h2>
          </div>
          <div className="space-y-2.5">
            {moves.map((m) => (
              <Link
                key={m.title}
                href={m.href}
                className="block p-3.5 rounded-md border border-line bg-paper hover:border-line-strong hover:bg-warm hover:-translate-y-px transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[14px] text-ink">{m.title}</p>
                    <p className="text-[13px] text-ink-3 mt-1 leading-relaxed">{m.body}</p>
                  </div>
                  <span
                    className={`shrink-0 h-7 px-2.5 inline-flex items-center rounded-full text-[12.5px] font-medium ${
                      {
                        blue: "bg-brand-soft text-brand",
                        green: "bg-save-soft text-save",
                        amber: "bg-goal-soft text-goal",
                      }[m.tone]
                    }`}
                  >
                    {m.cta}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
