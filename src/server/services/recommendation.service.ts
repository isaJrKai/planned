// ============================================================================
// RECOMMENDATION SERVICE
// ============================================================================
// Generates smart, educational suggestions based on user activity.
//
// Design principles:
//   - Educate, encourage, never shame, never manipulate
//   - Recommendations must be actionable and specific
//   - Never compare children to each other
//   - Never use urgency tactics ("Act now!" "Limited time!")
//   - Tone: warm, supportive, like a wise family member
// ============================================================================

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export interface Recommendation {
  id?: string;
  type: "savings" | "spending" | "goals" | "education" | "investment" | "tokens" | "general";
  priority: number;  // 1 (highest) to 10 (lowest)
  title: string;
  body: string;
  actionLabel?: string;
  actionTarget?: string;
}

export const RecommendationService = {
  // Generate recommendations for a parent (based on family-wide data).
  async forParent(familyId: string): Promise<Recommendation[]> {
    const recs: Recommendation[] = [];

    // MVP: get all children (single-family app). When multi-tenant is added,
    // filter by familyId.
    const children = await db.child.findMany();

    const goals = await db.goal.findMany();

    const transactions = await db.transaction.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    // Rule: family has no goals yet
    if (goals.length === 0) {
      recs.push({
        type: "goals",
        priority: 3,
        title: "Set your first family goal",
        body: "Goals give your children something to work toward. Try setting a shared goal like a family holiday — it teaches teamwork and planning.",
        actionLabel: "Create a goal",
        actionTarget: "goals",
      });
    }

    // Rule: child close to goal
    for (const child of children) {
      const childGoals = goals.filter(
        (g) => g.ownerId === child.id && g.type === "save",
      );
      for (const goal of childGoals) {
        const pct = (goal.currentAmount / goal.targetAmount) * 100;
        if (pct >= 75 && pct < 100) {
          recs.push({
            type: "goals",
            priority: 2,
            title: `${child.name} is close to "${goal.title}"`,
            body: `${child.name} is ${pct.toFixed(0)}% toward their goal. A small contribution or a few words of encouragement could help them cross the finish line.`,
            actionLabel: "View goal",
            actionTarget: "goals",
          });
        }
      }
    }

    // Rule: child hasn't saved this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    for (const child of children) {
      const savedThisMonth = transactions.some(
        (t) =>
          t.childId === child.id &&
          t.type === "save" &&
          new Date(Number(t.timestamp)) >= monthStart,
      );
      if (!savedThisMonth && child.currentAmount > 0) {
        recs.push({
          type: "savings",
          priority: 4,
          title: `${child.name} hasn't saved this month`,
          body: `A gentle reminder might help. Sometimes children just need a nudge to maintain their saving habit.`,
        });
      }
    }

    // Rule: suggest education
    try {
      const completedLessons = await db.lessonProgress.count({
        where: { status: "COMPLETED" },
      });
      if (completedLessons === 0) {
        recs.push({
          type: "education",
          priority: 5,
          title: "Explore financial literacy lessons",
          body: "Your children can learn about saving, budgeting, and compound growth through short interactive lessons. The first one takes just 8 minutes.",
          actionLabel: "View lessons",
          actionTarget: "learn",
        });
      }
    } catch (e) {
      // Skip if lessonProgress table isn't available yet
    }

    // Rule: award tokens if haven't recently
    const recentAwards = await db.tokenLedgerEntry.findMany({
      where: {
        type: "parent_give",
        timestamp: { gte: BigInt(monthStart.getTime()) },
      },
    });
    if (recentAwards.length === 0) {
      recs.push({
        type: "tokens",
        priority: 6,
        title: "Consider awarding tokens",
        body: "Tokens are a great way to recognize good habits — completing chores, helping at home, or doing well at school. Children can redeem them for savings.",
        actionLabel: "Award tokens",
        actionTarget: "tokens",
      });
    }

    // Sort by priority
    let result = recs.sort((a, b) => a.priority - b.priority).slice(0, 5);

    // Fallback: if no rules matched, show a general tip
    if (result.length === 0) {
      result.push({
        type: "general",
        priority: 10,
        title: "Set a savings goal with your children",
        body: "Goals give children something to work toward. Try creating a shared family goal — it teaches teamwork and planning.",
        actionLabel: "Create a goal",
        actionTarget: "goals",
      });
    }

    return result;
  },

  // Generate recommendations for a child (based on their own data).
  async forChild(childId: string): Promise<Recommendation[]> {
    const recs: Recommendation[] = [];

    const child = await db.child.findUnique({ where: { id: childId } });
    if (!child) return recs;

    const goals = await db.goal.findMany({
      where: { ownerId: childId },
    });

    const transactions = await db.transaction.findMany({
      where: { childId },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    // Rule: close to a goal
    for (const goal of goals) {
      if (goal.type !== "save") continue;
      const pct = (goal.currentAmount / goal.targetAmount) * 100;
      if (pct >= 75 && pct < 100) {
        recs.push({
          type: "goals",
          priority: 1,
          title: `You're almost there!`,
          body: `You're ${pct.toFixed(0)}% toward "${goal.title}". Just ${(goal.targetAmount - goal.currentAmount).toLocaleString()} more to reach your goal. You can do it!`,
          actionLabel: "Save more",
          actionTarget: "save",
        });
      }
    }

    // Rule: no goals yet
    if (goals.length === 0) {
      recs.push({
        type: "goals",
        priority: 3,
        title: "Set your first savings goal",
        body: "Having a goal makes saving more fun. What do you want to save for? A bicycle? A tablet? Set a goal and watch your progress grow.",
        actionLabel: "Create a goal",
        actionTarget: "goals",
      });
    }

    // Rule: saving streak (wrapped in try-catch for Prisma client compat)
    try {
      const streak = await db.savingStreak.findUnique({ where: { childId } });
      if (streak && streak.currentStreak >= 3) {
        recs.push({
          type: "savings",
          priority: 2,
          title: `${streak.currentStreak}-day saving streak!`,
          body: `You've saved for ${streak.currentStreak} days in a row. Keep it going — consistency is the secret to building wealth.`,
        });
      }
    } catch (e) {
      // Skip if savingStreak table isn't available yet
    }

    // Rule: spent less this month vs last month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const thisMonthSpent = await db.spendingEntry.aggregate({
      where: {
        ownerId: childId,
        timestamp: { gte: BigInt(thisMonthStart.getTime()) },
      },
      _sum: { amount: true },
    });
    const lastMonthSpent = await db.spendingEntry.aggregate({
      where: {
        ownerId: childId,
        timestamp: {
          gte: BigInt(lastMonthStart.getTime()),
          lte: BigInt(lastMonthEnd.getTime()),
        },
      },
      _sum: { amount: true },
    });

    if (
      lastMonthSpent._sum.amount &&
      thisMonthSpent._sum.amount !== null &&
      thisMonthSpent._sum.amount < lastMonthSpent._sum.amount
    ) {
      const diff = lastMonthSpent._sum.amount - (thisMonthSpent._sum.amount ?? 0);
      recs.push({
        type: "spending",
        priority: 4,
        title: "You're spending less this month!",
        body: `You've spent ${diff.toLocaleString()} less than last month. That's smart budgeting. The money you saved could go toward your goal.`,
      });
    }

    // Rule: suggest a lesson (wrapped in try-catch for Prisma client compat)
    try {
      const completedLessonIds = await db.lessonProgress.findMany({
        where: { userId: childId, status: "COMPLETED" },
        select: { lessonId: true },
      });
      const allLessons = await db.lesson.findMany({
        orderBy: { order: "asc" },
      });
      const nextLesson = allLessons.find(
        (l) => !completedLessonIds.some((c) => c.lessonId === l.id),
      );
      if (nextLesson) {
        recs.push({
          type: "education",
          priority: 5,
          title: `Learn: ${nextLesson.title}`,
          body: `${nextLesson.description} It takes about ${nextLesson.estimatedMinutes} minutes.`,
          actionLabel: "Start lesson",
          actionTarget: "learn",
        });
      }
    } catch (e) {
      // Skip if lesson tables aren't available yet
    }

    let result = recs.sort((a, b) => a.priority - b.priority).slice(0, 4);

    // Fallback
    if (result.length === 0) {
      result.push({
        type: "education",
        priority: 10,
        title: "Start your first financial literacy lesson",
        body: "Learn about saving, budgeting, and compound growth through short interactive lessons. The first one takes just 8 minutes.",
        actionLabel: "Start learning",
        actionTarget: "learn",
      });
    }

    return result;
  },
};
