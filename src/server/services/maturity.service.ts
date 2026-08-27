// ============================================================================
// FINANCIAL MATURITY SCORE
// ============================================================================
// A transparent, explainable scoring system that measures a child's financial
// development across 4 dimensions. NOT a behavioral profile. NOT sensitive data.
// Scores are 0-100 and visible to both parent and child.
//
// Dimensions:
//   1. Saving Consistency — are they saving regularly?
//   2. Goal Discipline — are they completing goals?
//   3. Budget Awareness — are they staying under budget?
//   4. Financial Knowledge — are they completing lessons?
//
// All scores are transparent: the child can see exactly how they earned each
// point and what they can do to improve. No hidden scoring.
// ============================================================================

import { db } from "@/lib/db";

export interface MaturityScore {
  total: number;          // 0-100
  level: string;          // "Beginner" | "Growing" | "Confident" | "Mentor"
  dimensions: {
    savingConsistency: { score: number; label: string; explanation: string };
    goalDiscipline: { score: number; label: string; explanation: string };
    budgetAwareness: { score: number; label: string; explanation: string };
    financialKnowledge: { score: number; label: string; explanation: string };
  };
  suggestions: string[];  // How to improve — positive, never shaming
}

export const MaturityService = {
  async calculate(childId: string): Promise<MaturityScore> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date(now.getTime() - 30 * 86400000);

    // ---- 1. Saving Consistency (0-25 points) ----
    // 0-2 saves in 30 days = 5 pts
    // 3-5 saves = 15 pts
    // 6+ saves = 25 pts
    const recentSaves = await db.transaction.count({
      where: {
        childId,
        type: "save",
        timestamp: { gte: BigInt(last30Days.getTime()) },
      },
    });

    let savingScore = 5;
    if (recentSaves >= 6) savingScore = 25;
    else if (recentSaves >= 3) savingScore = 15;

    // ---- 2. Goal Discipline (0-25 points) ----
    // 0 completed goals = 0 pts
    // 1 goal = 10 pts
    // 2 goals = 20 pts
    // 3+ goals = 25 pts
    const completedGoals = await db.goal.count({
      where: {
        ownerId: childId,
        currentAmount: { gte: db.goal.fields.targetAmount },
      },
    });

    let goalScore = 0;
    if (completedGoals >= 3) goalScore = 25;
    else if (completedGoals >= 2) goalScore = 20;
    else if (completedGoals >= 1) goalScore = 10;

    // ---- 3. Budget Awareness (0-25 points) ----
    // All categories under budget = 25 pts
    // 1 category over = 15 pts
    // 2+ over = 5 pts
    // No spending data = 0 pts
    const categories = await db.spendingCategory.findMany();
    let overBudgetCount = 0;
    let hasSpendingData = false;

    for (const cat of categories) {
      const spent = await db.spendingEntry.aggregate({
        where: {
          ownerId: childId,
          category: cat.name,
          timestamp: { gte: BigInt(monthStart.getTime()) },
        },
        _sum: { amount: true },
      });
      if ((spent._sum.amount ?? 0) > 0) hasSpendingData = true;
      if ((spent._sum.amount ?? 0) > cat.budget) overBudgetCount++;
    }

    let budgetScore = 0;
    if (hasSpendingData) {
      if (overBudgetCount === 0) budgetScore = 25;
      else if (overBudgetCount === 1) budgetScore = 15;
      else budgetScore = 5;
    }

    // ---- 4. Financial Knowledge (0-25 points) ----
    // 0 lessons = 0 pts
    // 1 lesson = 8 pts
    // 2-3 lessons = 16 pts
    // 4+ lessons = 25 pts
    let lessonScore = 0;
    try {
      const completedLessons = await db.lessonProgress.count({
        where: { userId: childId, status: "COMPLETED" },
      });
      if (completedLessons >= 4) lessonScore = 25;
      else if (completedLessons >= 2) lessonScore = 16;
      else if (completedLessons >= 1) lessonScore = 8;
    } catch {
      // Skip if lessons not available
    }

    const total = savingScore + goalScore + budgetScore + lessonScore;
    const level = total >= 75 ? "Mentor" : total >= 50 ? "Confident" : total >= 25 ? "Growing" : "Beginner";

    // Generate positive suggestions (never shaming)
    const suggestions: string[] = [];
    if (savingScore < 25) suggestions.push("Save a small amount regularly — even UGX 500 counts!");
    if (goalScore < 25) suggestions.push("Complete a savings goal to earn more points.");
    if (budgetScore < 25 && hasSpendingData) suggestions.push("Try staying under budget in all categories this month.");
    if (lessonScore < 25) suggestions.push("Complete financial literacy lessons in the Learn tab.");
    if (suggestions.length === 0) suggestions.push("You're doing great! Keep up the consistent habits.");

    return {
      total,
      level,
      dimensions: {
        savingConsistency: {
          score: savingScore,
          label: "Saving Consistency",
          explanation: `${recentSaves} saves in the last 30 days`,
        },
        goalDiscipline: {
          score: goalScore,
          label: "Goal Discipline",
          explanation: `${completedGoals} goals completed`,
        },
        budgetAwareness: {
          score: budgetScore,
          label: "Budget Awareness",
          explanation: hasSpendingData
            ? `${overBudgetCount} categor${overBudgetCount === 1 ? "y" : "ies"} over budget this month`
            : "No spending data yet",
        },
        financialKnowledge: {
          score: lessonScore,
          label: "Financial Knowledge",
          explanation: "Lessons completed in the Learn tab",
        },
      },
      suggestions,
    };
  },
};
