"use client";

// ============================================================================
// FAMILY HEALTH DASHBOARD — participation, learning, goal, habit indicators
// ============================================================================
// Shows parents a calm, non-judgmental overview of their family's financial
// wellness across 5 dimensions. Never compares children. Never shames.
// Every indicator explains what it measures and what "healthy" looks like.
// ============================================================================

import { useEffect, useState } from "react";
import {
  Heart, TrendingUp, BookOpen, Target, Wallet, Activity,
  CheckCircle2, Circle, AlertCircle, Info,
} from "lucide-react";

interface FamilyHealth {
  participation: {
    savesThisMonth: number;
    spendingLoggedThisMonth: number;
    tokensAwardedThisMonth: number;
    coachQueriesTotal: number;
    activeChildren: number;
    totalChildren: number;
  };
  learning: {
    lessonsCompleted: number;
    lessonsAvailable: number;
    completionRate: number;
    avgQuizScore: number;
    quizAttempts: number;
  };
  goals: {
    totalGoals: number;
    completedGoals: number;
    completionRate: number;
    goalsInProgress: number;
    avgProgress: number;
  };
  habits: {
    avgSavingsPerChild: number;
    totalFamilySavings: number;
    savingStreakActive: boolean;
    spendingTrend: "up" | "down" | "stable";
    spendingThisMonth: number;
    spendingLastMonth: number;
  };
  engagement: {
    charterExists: boolean;
    annualThemeSet: boolean;
    monthlyQuoteSet: boolean;
    profilePhotosSet: number;
    totalMembers: number;
  };
}

function HealthIndicator({
  label, value, max, unit, icon: Icon, status, explanation,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  icon: any;
  status: "healthy" | "growing" | "needs-attention";
  explanation: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colors = {
    healthy: "var(--chart-2)",
    growing: "var(--primary)",
    "needs-attention": "var(--chart-3)",
  };
  const color = colors[status];
  const StatusIcon = status === "healthy" ? CheckCircle2 : status === "growing" ? Circle : AlertCircle;

  return (
    <div className="surface-flat rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" style={{ color }} />
          <span className="text-xs text-foreground/70 tracking-wide">{label}</span>
        </div>
        <StatusIcon className="h-3 w-3" style={{ color }} />
      </div>
      <div className="font-editorial text-xl tabular-nums" style={{ color }}>
        {value.toLocaleString()}
        <span className="text-xs text-foreground/40 ml-1">{unit}</span>
      </div>
      <div className="progress-thin mt-2">
        <div style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 60%, transparent))` }} />
      </div>
      <div className="text-[9px] text-foreground/35 mt-1.5 leading-relaxed">{explanation}</div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="surface-wood rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
        <h3 className="font-editorial text-sm text-foreground tracking-wide">{title}</h3>
      </div>
      <div className="divider-gold mb-4" />
      {children}
    </div>
  );
}

export function FamilyHealthDashboard() {
  const [health, setHealth] = useState<FamilyHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setHealth({
            participation: {
              savesThisMonth: d.product?.savesThisMonth ?? 0,
              spendingLoggedThisMonth: d.product?.spendingEntriesCount ?? 0,
              tokensAwardedThisMonth: d.product?.tokensAwarded ?? 0,
              coachQueriesTotal: d.ai?.coachQueries ?? 0,
              activeChildren: d.family?.totalChildren ?? 0,
              totalChildren: d.family?.totalChildren ?? 0,
            },
            learning: {
              lessonsCompleted: d.education?.lessonsCompleted ?? 0,
              lessonsAvailable: d.education?.totalLessons ?? 0,
              completionRate: d.education?.completionRate ?? 0,
              avgQuizScore: d.education?.avgQuizScore ?? 0,
              quizAttempts: d.education?.quizAttempts ?? 0,
            },
            goals: {
              totalGoals: d.product?.totalGoals ?? 0,
              completedGoals: d.product?.completedGoals ?? 0,
              completionRate: d.product?.goalCompletionRate ?? 0,
              goalsInProgress: (d.product?.totalGoals ?? 0) - (d.product?.completedGoals ?? 0),
              avgProgress: 0,
            },
            habits: {
              avgSavingsPerChild: d.family?.avgSavingsPerChild ?? 0,
              totalFamilySavings: d.family?.totalFamilySavings ?? 0,
              savingStreakActive: (d.product?.savesThisMonth ?? 0) > 0,
              spendingTrend: "stable" as const,
              spendingThisMonth: d.product?.totalSpending ?? 0,
              spendingLastMonth: 0,
            },
            engagement: {
              charterExists: true,
              annualThemeSet: true,
              monthlyQuoteSet: true,
              profilePhotosSet: 0,
              totalMembers: (d.family?.totalChildren ?? 0) + (d.family?.totalParents ?? 0),
            },
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="surface-wood rounded-lg p-6">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" style={{ width: "60%" }} />
      </div>
    );
  }

  if (!health) return null;

  const overallStatus = "growing" as const;

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Overall banner */}
      <div className="surface-wood-strong rounded-lg p-5 flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", border: "1px solid var(--primary)" }}
        >
          <Heart className="h-6 w-6" style={{ color: "var(--primary)" }} />
        </div>
        <div>
          <div className="font-editorial text-lg text-foreground tracking-wide">Family Health</div>
          <div className="text-xs text-foreground/50">
            Your family is <span style={{ color: "var(--primary)" }}>growing</span> — consistent saving and learning will build lasting habits.
          </div>
        </div>
      </div>

      {/* Participation */}
      <SectionCard title="Participation" icon={Activity}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <HealthIndicator
            label="Saves This Month"
            value={health.participation.savesThisMonth}
            max={10}
            unit="deposits"
            icon={TrendingUp}
            status={health.participation.savesThisMonth >= 3 ? "healthy" : health.participation.savesThisMonth >= 1 ? "growing" : "needs-attention"}
            explanation="Consistent saving is the strongest predictor of long-term wealth-building."
          />
          <HealthIndicator
            label="Spending Logged"
            value={health.participation.spendingLoggedThisMonth}
            max={20}
            unit="entries"
            icon={Wallet}
            status={health.participation.spendingLoggedThisMonth >= 5 ? "healthy" : "growing"}
            explanation="Tracking spending builds budget awareness and mindful spending habits."
          />
          <HealthIndicator
            label="Tokens Awarded"
            value={health.participation.tokensAwardedThisMonth}
            max={100}
            unit="◈"
            icon={Activity}
            status={health.participation.tokensAwardedThisMonth >= 10 ? "healthy" : "growing"}
            explanation="Tokens recognize good habits. Regular awards reinforce positive behavior."
          />
          <HealthIndicator
            label="AI Coach Used"
            value={health.participation.coachQueriesTotal}
            max={10}
            unit="questions"
            icon={Activity}
            status={health.participation.coachQueriesTotal >= 1 ? "healthy" : "growing"}
            explanation="Asking the coach questions shows curiosity about financial concepts."
          />
        </div>
      </SectionCard>

      {/* Learning */}
      <SectionCard title="Educational Progress" icon={BookOpen}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <HealthIndicator
            label="Lessons Completed"
            value={health.learning.lessonsCompleted}
            max={health.learning.lessonsAvailable}
            unit={`of ${health.learning.lessonsAvailable}`}
            icon={BookOpen}
            status={health.learning.completionRate >= 50 ? "healthy" : health.learning.completionRate >= 1 ? "growing" : "needs-attention"}
            explanation="Financial literacy lessons teach saving, budgeting, compound growth, and more."
          />
          <HealthIndicator
            label="Completion Rate"
            value={health.learning.completionRate}
            max={100}
            unit="%"
            icon={CheckCircle2}
            status={health.learning.completionRate >= 50 ? "healthy" : "growing"}
            explanation="Percentage of available lessons that have been completed."
          />
          <HealthIndicator
            label="Quiz Attempts"
            value={health.learning.quizAttempts}
            max={10}
            unit="attempts"
            icon={Activity}
            status={health.learning.quizAttempts >= 1 ? "healthy" : "growing"}
            explanation="Taking quizzes reinforces learning and measures understanding."
          />
          <HealthIndicator
            label="Avg Quiz Score"
            value={health.learning.avgQuizScore}
            max={100}
            unit="%"
            icon={CheckCircle2}
            status={health.learning.avgQuizScore >= 70 ? "healthy" : "growing"}
            explanation="Average score across all quiz attempts. 60% needed to pass each lesson."
          />
        </div>
      </SectionCard>

      {/* Goals */}
      <SectionCard title="Goal Achievement" icon={Target}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <HealthIndicator
            label="Goals in Progress"
            value={health.goals.goalsInProgress}
            max={10}
            unit="active"
            icon={Target}
            status={health.goals.goalsInProgress >= 1 ? "healthy" : "growing"}
            explanation="Having active goals gives children something to work toward."
          />
          <HealthIndicator
            label="Goals Completed"
            value={health.goals.completedGoals}
            max={10}
            unit="done"
            icon={CheckCircle2}
            status={health.goals.completedGoals >= 1 ? "healthy" : "growing"}
            explanation="Completing goals builds confidence and shows that saving works."
          />
          <HealthIndicator
            label="Completion Rate"
            value={health.goals.completionRate}
            max={100}
            unit="%"
            icon={TrendingUp}
            status={health.goals.completionRate >= 25 ? "healthy" : "growing"}
            explanation="Percentage of all goals that have been completed."
          />
        </div>
      </SectionCard>

      {/* Habits */}
      <SectionCard title="Financial Habits" icon={TrendingUp}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <HealthIndicator
            label="Total Family Savings"
            value={health.habits.totalFamilySavings}
            max={1000000}
            unit="UGX"
            icon={TrendingUp}
            status={health.habits.totalFamilySavings >= 100000 ? "healthy" : "growing"}
            explanation="Combined savings across all children. Growing consistently is what matters."
          />
          <HealthIndicator
            label="Avg Savings/Child"
            value={health.habits.avgSavingsPerChild}
            max={300000}
            unit="UGX"
            icon={TrendingUp}
            status={health.habits.avgSavingsPerChild >= 50000 ? "healthy" : "growing"}
            explanation="Average savings balance per child. Consistency matters more than amount."
          />
          <HealthIndicator
            label="Saving This Month"
            value={health.participation.savesThisMonth > 0 ? 1 : 0}
            max={1}
            unit={health.habits.savingStreakActive ? "active" : "dormant"}
            icon={Activity}
            status={health.habits.savingStreakActive ? "healthy" : "needs-attention"}
            explanation="At least one family member has saved this month. Consistency builds habits."
          />
        </div>
      </SectionCard>

      {/* Engagement */}
      <SectionCard title="Family Engagement" icon={Heart}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="surface-flat rounded-lg p-3 flex items-center gap-3">
            {health.engagement.charterExists ? (
              <CheckCircle2 className="h-4 w-4" style={{ color: "var(--chart-2)" }} />
            ) : (
              <Circle className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
            )}
            <div>
              <div className="text-xs text-foreground/70">Family Charter</div>
              <div className="text-[9px] text-foreground/40">{health.engagement.charterExists ? "Created" : "Not set"}</div>
            </div>
          </div>
          <div className="surface-flat rounded-lg p-3 flex items-center gap-3">
            {health.engagement.annualThemeSet ? (
              <CheckCircle2 className="h-4 w-4" style={{ color: "var(--chart-2)" }} />
            ) : (
              <Circle className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
            )}
            <div>
              <div className="text-xs text-foreground/70">Annual Theme</div>
              <div className="text-[9px] text-foreground/40">{health.engagement.annualThemeSet ? "Set" : "Not set"}</div>
            </div>
          </div>
          <div className="surface-flat rounded-lg p-3 flex items-center gap-3">
            {health.engagement.monthlyQuoteSet ? (
              <CheckCircle2 className="h-4 w-4" style={{ color: "var(--chart-2)" }} />
            ) : (
              <Circle className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
            )}
            <div>
              <div className="text-xs text-foreground/70">Monthly Quote</div>
              <div className="text-[9px] text-foreground/40">{health.engagement.monthlyQuoteSet ? "Set" : "Not set"}</div>
            </div>
          </div>
          <div className="surface-flat rounded-lg p-3 flex items-center gap-3">
            <Info className="h-4 w-4" style={{ color: "var(--primary)" }} />
            <div>
              <div className="text-xs text-foreground/70">Family Members</div>
              <div className="text-[9px] text-foreground/40">{health.engagement.totalMembers} total</div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Non-judgmental note */}
      <div className="text-center text-[10px] text-foreground/35 italic max-w-md mx-auto leading-relaxed">
        Health indicators are educational, not competitive. They show where your family is growing,
        not how you compare to others. Every family's journey is different — consistency matters
        more than amount.
      </div>
    </div>
  );
}
