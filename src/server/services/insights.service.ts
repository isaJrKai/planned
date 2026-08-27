// ============================================================================
// INSIGHTS ENGINE — intelligent summaries for parents
// ============================================================================
// Generates factual, explainable, non-judgmental insights from store data.
// Every insight includes a "why" explanation for the explainability framework.
// ============================================================================

import { db } from "@/lib/db";

export interface Insight {
  id: string;
  type: "savings" | "spending" | "goals" | "education" | "family";
  priority: number; // 1 (highest) to 10
  title: string;
  body: string;
  why: string; // Explainability: why am I seeing this?
  childName?: string;
  actionLabel?: string;
  actionTarget?: string;
  confidence: number; // 0-1
}

export const InsightsEngine = {
  async generateForFamily(): Promise<Insight[]> {
    const insights: Insight[] = [];

    const children = await db.child.findMany();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    for (const child of children) {
      // ---- Savings insights ----

      // 1. Consistency: has the child saved this month?
      const savesThisMonth = await db.transaction.findMany({
        where: {
          childId: child.id,
          type: "save",
          timestamp: { gte: BigInt(monthStart.getTime()) },
        },
      });

      if (savesThisMonth.length >= 3) {
        insights.push({
          id: `insight-save-consistency-${child.id}`,
          type: "savings",
          priority: 3,
          title: `${child.name} has saved ${savesThisMonth.length} times this month`,
          body: `${child.name} is building a consistent saving habit — ${savesThisMonth.length} deposits this month totaling ${savesThisMonth.reduce((s, t) => s + t.amount, 0).toLocaleString()} UGX.`,
          why: `This insight appears because ${child.name} has made ${savesThisMonth.length} savings deposits since ${monthStart.toLocaleDateString()}. Consistency is the strongest predictor of long-term wealth-building.`,
          childName: child.name,
          confidence: 0.95,
        });
      }

      // 2. Goal proximity
      const goals = await db.goal.findMany({
        where: { ownerId: child.id, type: "save" },
      });
      for (const goal of goals) {
        const pct = (goal.currentAmount / goal.targetAmount) * 100;
        if (pct >= 75 && pct < 100) {
          insights.push({
            id: `insight-goal-proximity-${goal.id}`,
            type: "goals",
            priority: 2,
            title: `${child.name} is ${pct.toFixed(0)}% toward "${goal.title}"`,
            body: `Just ${(goal.targetAmount - goal.currentAmount).toLocaleString()} UGX away from completing this goal. This is a great time to offer encouragement.`,
            why: `This insight appears because ${child.name}'s goal "${goal.title}" is at ${pct.toFixed(0)}% completion. Goals above 75% have the highest completion rate when parents offer encouragement.`,
            childName: child.name,
            actionLabel: "View goals",
            actionTarget: "goals",
            confidence: 0.9,
          });
        }
      }

      // 3. Spending trend: this month vs last month
      const thisMonthSpending = await db.spendingEntry.aggregate({
        where: {
          ownerId: child.id,
          timestamp: { gte: BigInt(monthStart.getTime()) },
        },
        _sum: { amount: true },
      });

      const lastMonthSpending = await db.spendingEntry.aggregate({
        where: {
          ownerId: child.id,
          timestamp: {
            gte: BigInt(lastMonthStart.getTime()),
            lte: BigInt(lastMonthEnd.getTime()),
          },
        },
        _sum: { amount: true },
      });

      if (lastMonthSpending._sum.amount && thisMonthSpending._sum.amount !== null) {
        const change = (thisMonthSpending._sum.amount ?? 0) - lastMonthSpending._sum.amount;
        const pctChange = lastMonthSpending._sum.amount > 0
          ? (change / lastMonthSpending._sum.amount) * 100
          : 0;

        if (pctChange < -15) {
          insights.push({
            id: `insight-spending-down-${child.id}`,
            type: "spending",
            priority: 4,
            title: `${child.name} reduced spending by ${Math.abs(pctChange).toFixed(0)}%`,
            body: `${child.name} spent ${Math.abs(change).toLocaleString()} UGX less this month compared to last month. This shows growing budget awareness.`,
            why: `This insight appears because ${child.name}'s spending decreased from ${lastMonthSpending._sum.amount.toLocaleString()} to ${(thisMonthSpending._sum.amount ?? 0).toLocaleString()} UGX month-over-month. A decrease of more than 15% is notable.`,
            childName: child.name,
            confidence: 0.85,
          });
        } else if (pctChange > 30 && lastMonthSpending._sum.amount > 0) {
          insights.push({
            id: `insight-spending-up-${child.id}`,
            type: "spending",
            priority: 5,
            title: `${child.name}'s spending increased ${pctChange.toFixed(0)}%`,
            body: `${child.name} spent ${change.toLocaleString()} UGX more this month than last. This could be a good time to talk about budgeting together.`,
            why: `This insight appears because ${child.name}'s spending increased from ${lastMonthSpending._sum.amount.toLocaleString()} to ${(thisMonthSpending._sum.amount ?? 0).toLocaleString()} UGX. An increase over 30% may warrant a conversation about budgeting.`,
            childName: child.name,
            confidence: 0.8,
          });
        }
      }

      // 4. Lesson engagement
      try {
        const completedLessons = await db.lessonProgress.count({
          where: { userId: child.id, status: "COMPLETED" },
        });
        if (completedLessons > 0 && completedLessons === 1) {
          insights.push({
            id: `insight-lesson-first-${child.id}`,
            type: "education",
            priority: 6,
            title: `${child.name} completed their first financial literacy lesson`,
            body: `${child.name} is actively learning about money. Completing lessons builds financial knowledge that lasts a lifetime.`,
            why: `This insight appears because ${child.name} has completed ${completedLessons} lesson(s) in the Learn tab. Early financial education is strongly linked to better money habits in adulthood.`,
            childName: child.name,
            actionLabel: "View lessons",
            actionTarget: "learn",
            confidence: 0.95,
          });
        }
      } catch {
        // Skip if lesson tables not available
      }
    }

    // ---- Family-level insights ----

    // 5. Family savings total this month
    const familySavesThisMonth = await db.transaction.aggregate({
      where: {
        type: "save",
        timestamp: { gte: BigInt(monthStart.getTime()) },
      },
      _sum: { amount: true },
    });

    if ((familySavesThisMonth._sum.amount ?? 0) > 0) {
      insights.push({
        id: "insight-family-saving",
        type: "family",
        priority: 7,
        title: `Your family saved ${familySavesThisMonth._sum.amount?.toLocaleString()} UGX this month`,
        body: `Across all children, your family has deposited ${familySavesThisMonth._sum.amount?.toLocaleString()} UGX into savings this month. That's real progress.`,
        why: `This insight aggregates all "save" transactions across all children since ${monthStart.toLocaleDateString()}. It reflects the family's collective saving activity.`,
        confidence: 1.0,
      });
    }

    // Sort by priority + confidence
    return insights
      .sort((a, b) => a.priority - b.priority || b.confidence - a.confidence)
      .slice(0, 6);
  },
};
