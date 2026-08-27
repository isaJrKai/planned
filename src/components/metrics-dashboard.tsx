"use client";

// ============================================================================
// METRICS DASHBOARD — comprehensive platform analytics
// ============================================================================

import { useEffect, useState } from "react";
import { TrendingUp, BookOpen, Users, Award, Sparkles, Activity } from "lucide-react";

interface Metrics {
  product: {
    totalSaves: number; totalSaveAmount: number; savesThisMonth: number;
    spendingEntriesCount: number; totalSpending: number;
    totalGoals: number; completedGoals: number; goalCompletionRate: number;
    tokensAwarded: number; tokensRedeemed: number;
  };
  education: {
    totalLessons: number; lessonsCompleted: number; completionRate: number;
    quizAttempts: number; avgQuizScore: number;
  };
  family: {
    totalChildren: number; totalParents: number;
    totalFamilySavings: number; avgSavingsPerChild: number;
  };
  achievements: { totalBadgesEarned: number; totalAchievements: number };
  ai: { coachQueries: number };
  events: { event: string; count: number }[];
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function MetricCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <div className="surface-wood rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="micro-label">{label}</div>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <div className="font-editorial text-2xl text-foreground tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-foreground/45 mt-1">{sub}</div>}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="surface-wood rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
        <div className="micro-label-gold">{title}</div>
      </div>
      <div className="divider-gold mb-5" />
      {children}
    </div>
  );
}

export function MetricsDashboard() {
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/metrics").then((r) => r.json()).then((d) => {
      if (!d.error) setM(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-foreground/40 text-sm">Calculating metrics...</div>;
  if (!m) return <div className="text-center py-12 text-foreground/40 text-sm">Unable to load metrics.</div>;

  const maxEventCount = Math.max(...m.events.map((e) => e.count), 1);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Product Metrics */}
      <div>
        <h3 className="font-editorial text-lg text-foreground tracking-wide mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" style={{ color: "var(--primary)" }} /> Product Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
          <MetricCard label="Total Saved" value={`UGX ${fmt(m.product.totalSaveAmount)}`} sub={`${m.product.totalSaves} deposits`} icon={TrendingUp} color="var(--chart-2)" />
          <MetricCard label="Saves This Month" value={String(m.product.savesThisMonth)} sub="deposits" icon={Activity} color="var(--primary)" />
          <MetricCard label="Total Spending" value={`UGX ${fmt(m.product.totalSpending)}`} sub={`${m.product.spendingEntriesCount} entries`} icon={Activity} color="var(--chart-3)" />
          <MetricCard label="Goal Completion" value={`${m.product.goalCompletionRate}%`} sub={`${m.product.completedGoals}/${m.product.totalGoals} goals`} icon={TrendingUp} color="var(--chart-2)" />
          <MetricCard label="Tokens Awarded" value={fmt(m.product.tokensAwarded)} sub="◈ given" icon={Sparkles} color="var(--primary)" />
          <MetricCard label="Tokens Redeemed" value={fmt(m.product.tokensRedeemed)} sub="◈ cashed in" icon={Sparkles} color="var(--chart-5)" />
        </div>
      </div>

      {/* Educational Metrics */}
      <SectionCard title="Educational Analytics" icon={BookOpen}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Lessons Available" value={String(m.education.totalLessons)} icon={BookOpen} color="var(--primary)" />
          <MetricCard label="Lessons Completed" value={String(m.education.lessonsCompleted)} sub={`${m.education.completionRate}% rate`} icon={BookOpen} color="var(--chart-2)" />
          <MetricCard label="Quiz Attempts" value={String(m.education.quizAttempts)} icon={Activity} color="var(--chart-3)" />
          <MetricCard label="Avg Quiz Score" value={`${m.education.avgQuizScore}%`} icon={Award} color="var(--chart-5)" />
        </div>
      </SectionCard>

      {/* Family Metrics */}
      <SectionCard title="Family Intelligence" icon={Users}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Children" value={String(m.family.totalChildren)} icon={Users} color="var(--primary)" />
          <MetricCard label="Parents" value={String(m.family.totalParents)} icon={Users} color="var(--chart-2)" />
          <MetricCard label="Total Family Savings" value={`UGX ${fmt(m.family.totalFamilySavings)}`} icon={TrendingUp} color="var(--chart-5)" />
          <MetricCard label="Avg Savings/Child" value={`UGX ${fmt(m.family.avgSavingsPerChild)}`} icon={TrendingUp} color="var(--primary)" />
        </div>
      </SectionCard>

      {/* Achievements + AI */}
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="Achievement System" icon={Award}>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Badges Earned" value={String(m.achievements.totalBadgesEarned)} icon={Award} color="var(--chart-5)" />
            <MetricCard label="Achievements Available" value={String(m.achievements.totalAchievements)} icon={Award} color="var(--primary)" />
          </div>
        </SectionCard>
        <SectionCard title="AI Intelligence" icon={Sparkles}>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Coach Queries" value={String(m.ai.coachQueries)} sub="total questions asked" icon={Sparkles} color="var(--primary)" />
            <MetricCard label="Avg Response" value="< 3s" sub="estimated" icon={Activity} color="var(--chart-2)" />
          </div>
        </SectionCard>
      </div>

      {/* Event Breakdown */}
      {m.events.length > 0 && (
        <SectionCard title="Event Activity (30 Days)" icon={Activity}>
          <div className="space-y-2">
            {m.events.map((e) => (
              <div key={e.event} className="flex items-center gap-3">
                <span className="text-xs font-mono text-foreground/60 w-36 shrink-0">{e.event}</span>
                <div className="progress-thin flex-1">
                  <div style={{ width: `${(e.count / maxEventCount) * 100}%` }} />
                </div>
                <span className="text-xs tabular-nums text-foreground/70 w-10 text-right shrink-0">{e.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
