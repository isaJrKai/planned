// ============================================================================
// ACHIEVEMENT SERVICE
// ============================================================================
// Evaluates user activity against achievement requirements and awards badges.
// Called after every domain event (savings, goals, spending, education).
//
// Design principles:
//   - Must motivate, never manipulate
//   - Must reinforce healthy habits (saving, budgeting, learning)
//   - No gambling psychology, no loot boxes, no variable reward addiction
//   - Badges are earned through consistent effort, not luck
// ============================================================================

import { db } from "@/lib/db";
import { publish } from "@/server/domain/events";
import { logger } from "@/lib/logger";
import type {
  Achievement,
  AchievementRequirement,
  EarnedAchievement,
  StreakInfo,
} from "@/server/domain/achievement-types";

// ---- Achievement seed definitions -----------------------------------------

export const SEED_ACHIEVEMENTS: Omit<Achievement, "id">[] = [
  {
    code: "FIRST_SAVE",
    title: "First Steps",
    description: "Made your very first savings deposit.",
    icon: "PiggyBank",
    category: "savings",
    tier: "bronze",
    points: 10,
    requirement: { type: "first_save", threshold: 1 },
  },
  {
    code: "STREAK_7",
    title: "Consistent Saver",
    description: "Saved money for 7 days in a row.",
    icon: "Flame",
    category: "streaks",
    tier: "silver",
    points: 25,
    requirement: { type: "streak_days", threshold: 7 },
  },
  {
    code: "STREAK_30",
    title: "Unbreakable",
    description: "Saved money for 30 days in a row.",
    icon: "Trophy",
    category: "streaks",
    tier: "gold",
    points: 50,
    requirement: { type: "streak_days", threshold: 30 },
  },
  {
    code: "GOAL_COMPLETER",
    title: "Goal Achieved",
    description: "Completed your first savings goal.",
    icon: "Target",
    category: "goals",
    tier: "silver",
    points: 30,
    requirement: { type: "goals_completed", threshold: 1 },
  },
  {
    code: "GOAL_MASTER",
    title: "Goal Master",
    description: "Completed 3 savings goals.",
    icon: "Award",
    category: "goals",
    tier: "gold",
    points: 60,
    requirement: { type: "goals_completed", threshold: 3 },
  },
  {
    code: "LEARNER",
    title: "Curious Mind",
    description: "Completed your first financial literacy lesson.",
    icon: "BookOpen",
    category: "education",
    tier: "bronze",
    points: 15,
    requirement: { type: "lessons_completed", threshold: 1 },
  },
  {
    code: "SCHOLAR",
    title: "Financial Scholar",
    description: "Completed 5 financial literacy lessons.",
    icon: "GraduationCap",
    category: "education",
    tier: "gold",
    points: 50,
    requirement: { type: "lessons_completed", threshold: 5 },
  },
  {
    code: "BUDGET_KEEPER",
    title: "Budget Keeper",
    description: "Stayed under budget in all categories for a month.",
    icon: "Wallet",
    category: "spending",
    tier: "silver",
    points: 30,
    requirement: { type: "spend_under_budget", threshold: 1 },
  },
  {
    code: "TOKEN_REDEEMER",
    title: "Token Redeemer",
    description: "Redeemed tokens for the first time.",
    icon: "Sparkles",
    category: "tokens",
    tier: "bronze",
    points: 10,
    requirement: { type: "token_redeemed", threshold: 1 },
  },
  {
    code: "FIRST_INVESTOR",
    title: "First Investment",
    description: "Made your first investment.",
    icon: "TrendingUp",
    category: "savings",
    tier: "silver",
    points: 25,
    requirement: { type: "investments_made", threshold: 1 },
  },
];

// ---- Service ---------------------------------------------------------------

export const AchievementService = {
  async seedAchievements() {
    for (const a of SEED_ACHIEVEMENTS) {
      await db.achievement.upsert({
        where: { code: a.code },
        update: {
          title: a.title,
          description: a.description,
          icon: a.icon,
          category: a.category,
          tier: a.tier,
          points: a.points,
          requirement: JSON.stringify(a.requirement),
        },
        create: {
          code: a.code,
          title: a.title,
          description: a.description,
          icon: a.icon,
          category: a.category,
          tier: a.tier,
          points: a.points,
          requirement: JSON.stringify(a.requirement),
        },
      });
    }
    logger.info(`Seeded ${SEED_ACHIEVEMENTS.length} achievements`);
  },

  async getEarned(userId: string): Promise<EarnedAchievement[]> {
    const rows = await db.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      achievementId: r.achievementId,
      achievement: {
        id: r.achievement.id,
        code: r.achievement.code,
        title: r.achievement.title,
        description: r.achievement.description,
        icon: r.achievement.icon,
        category: r.achievement.category as any,
        tier: r.achievement.tier as any,
        points: r.achievement.points,
        requirement: JSON.parse(r.achievement.requirement),
      },
      earnedAt: r.earnedAt.getTime(),
      metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
    }));
  },

  async getAll(): Promise<Achievement[]> {
    const rows = await db.achievement.findMany({
      orderBy: [{ category: "asc" }, { tier: "asc" }],
    });
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      description: r.description,
      icon: r.icon,
      category: r.category as any,
      tier: r.tier as any,
      points: r.points,
      requirement: JSON.parse(r.requirement),
    }));
  },

  async getTotalPoints(userId: string): Promise<number> {
    const earned = await db.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });
    return earned.reduce((sum, e) => sum + e.achievement.points, 0);
  },

  // Evaluate and award achievements for a user based on their activity.
  async evaluate(userId: string, childId: string): Promise<EarnedAchievement[]> {
    const allAchievements = await this.getAll();
    const earned = await this.getEarned(userId);
    const earnedCodes = new Set(earned.map((e) => e.achievement.code));

    const newlyEarned: EarnedAchievement[] = [];

    for (const achievement of allAchievements) {
      if (earnedCodes.has(achievement.code)) continue;

      const isEarned = await this.checkRequirement(achievement.requirement, childId, userId);
      if (isEarned) {
        const record = await db.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            metadata: JSON.stringify({ childId, evaluatedAt: Date.now() }),
          },
          include: { achievement: true },
        });

        const earned_achievement: EarnedAchievement = {
          id: record.id,
          achievementId: achievement.id,
          achievement,
          earnedAt: record.earnedAt.getTime(),
        };
        newlyEarned.push(earned_achievement);

        // Publish BadgeEarned event
        await publish({
          type: "BadgeEarned",
          userId,
          achievementCode: achievement.code,
          achievementTitle: achievement.title,
          tier: achievement.tier,
          points: achievement.points,
        });

        logger.info({ userId, achievement: achievement.code }, "Achievement earned");
      }
    }

    return newlyEarned;
  },

  // Check if a single requirement is met.
  async checkRequirement(
    req: AchievementRequirement,
    childId: string,
    userId: string,
  ): Promise<boolean> {
    switch (req.type) {
      case "first_save":
      case "savings_count": {
        const count = await db.transaction.count({
          where: { childId, type: "save" },
        });
        return count >= req.threshold;
      }

      case "total_saved": {
        const result = await db.transaction.aggregate({
          where: { childId, type: "save" },
          _sum: { amount: true },
        });
        return (result._sum.amount ?? 0) >= req.threshold;
      }

      case "streak_days": {
        const streak = await this.getStreak(childId);
        return streak.currentStreak >= req.threshold;
      }

      case "goals_completed": {
        const count = await db.goal.count({
          where: {
            ownerId: childId,
            currentAmount: { gte: db.goal.fields.targetAmount },
          },
        });
        return count >= req.threshold;
      }

      case "lessons_completed": {
        const count = await db.lessonProgress.count({
          where: { userId, status: "COMPLETED" },
        });
        return count >= req.threshold;
      }

      case "spend_under_budget": {
        // Check if all categories are under budget this month
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const categories = await db.spendingCategory.findMany();
        const spending = await db.spendingEntry.findMany({
          where: {
            ownerId: childId,
            timestamp: { gte: BigInt(monthStart.getTime()) },
          },
        });

        const allUnderBudget = categories.every((cat) => {
          const spent = spending
            .filter((s) => s.category === cat.name)
            .reduce((sum, s) => sum + s.amount, 0);
          return spent <= cat.budget;
        });
        return allUnderBudget && categories.length > 0;
      }

      case "token_redeemed": {
        const count = await db.tokenLedgerEntry.count({
          where: { childId, type: "redeem" },
        });
        return count >= req.threshold;
      }

      case "investments_made": {
        const count = await db.investment.count({
          where: { childId, status: "active" },
        });
        return count >= req.threshold;
      }

      default:
        return false;
    }
  },

  // ---- Streak tracking -----------------------------------------------------

  async getStreak(childId: string): Promise<StreakInfo> {
    const streak = await db.savingStreak.findUnique({
      where: { childId },
    });

    if (!streak) {
      return { currentStreak: 0, longestStreak: 0, lastSaveDate: null, daysUntilBreak: 0 };
    }

    const now = Date.now();
    const lastSave = streak.lastSaveDate?.getTime() ?? 0;
    const hoursSinceLastSave = (now - lastSave) / (1000 * 60 * 60);
    const daysUntilBreak = Math.max(0, 48 - hoursSinceLastSave); // 48h grace period

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastSaveDate: lastSave || null,
      daysUntilBreak,
    };
  },

  async updateStreak(childId: string): Promise<StreakInfo> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    const existing = await db.savingStreak.findUnique({
      where: { childId },
    });

    let currentStreak = 1;
    let longestStreak = 1;

    if (existing) {
      const lastSaveDate = existing.lastSaveDate
        ? new Date(existing.lastSaveDate)
        : null;

      if (lastSaveDate) {
        const lastSaveDay = new Date(
          lastSaveDate.getFullYear(),
          lastSaveDate.getMonth(),
          lastSaveDate.getDate(),
        );

        if (lastSaveDay.getTime() === today.getTime()) {
          // Already saved today — don't increment
          currentStreak = existing.currentStreak;
          longestStreak = existing.longestStreak;
        } else if (lastSaveDay.getTime() === yesterday.getTime()) {
          // Saved yesterday — extend streak
          currentStreak = existing.currentStreak + 1;
          longestStreak = Math.max(existing.longestStreak, currentStreak);
        } else {
          // Streak broken — reset
          currentStreak = 1;
          longestStreak = existing.longestStreak;
        }
      }

      await db.savingStreak.update({
        where: { childId },
        data: { currentStreak, longestStreak, lastSaveDate: today },
      });
    } else {
      await db.savingStreak.create({
        data: { childId, currentStreak, longestStreak, lastSaveDate: today },
      });
    }

    return this.getStreak(childId);
  },
};
