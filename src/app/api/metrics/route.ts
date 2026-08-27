// GET /api/metrics — comprehensive platform metrics
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date(now.getTime() - 30 * 86400000);

    // ---- Product Metrics ----
    let totalSaves = 0, totalSaveAmount = 0, savesThisMonth = 0;
    let totalSpending = 0, spendingEntriesCount = 0;
    let totalGoals = 0, completedGoals = 0;
    let tokensAwarded = 0, tokensRedeemed = 0;

    try {
      const saveAgg = await db.$queryRawUnsafe(`SELECT COUNT(*) as cnt, COALESCE(SUM(amount),0) as total FROM "Transaction" WHERE type = 'save'`);
      totalSaves = Number((saveAgg as any[])[0]?.cnt ?? 0);
      totalSaveAmount = Number((saveAgg as any[])[0]?.total ?? 0);

      const monthSaves = await db.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM "Transaction" WHERE type = 'save' AND timestamp >= ${BigInt(monthStart.getTime())}`);
      savesThisMonth = Number((monthSaves as any[])[0]?.cnt ?? 0);

      const spendAgg = await db.$queryRawUnsafe(`SELECT COUNT(*) as cnt, COALESCE(SUM(amount),0) as total FROM SpendingEntry`);
      spendingEntriesCount = Number((spendAgg as any[])[0]?.cnt ?? 0);
      totalSpending = Number((spendAgg as any[])[0]?.total ?? 0);

      const goalAgg = await db.$queryRawUnsafe(`SELECT COUNT(*) as total, SUM(CASE WHEN currentAmount >= targetAmount THEN 1 ELSE 0 END) as completed FROM Goal`);
      totalGoals = Number((goalAgg as any[])[0]?.total ?? 0);
      completedGoals = Number((goalAgg as any[])[0]?.completed ?? 0);

      const tokenAgg = await db.$queryRawUnsafe(`SELECT SUM(CASE WHEN type='parent_give' THEN tokens ELSE 0 END) as awarded, SUM(CASE WHEN type='redeem' THEN tokens ELSE 0 END) as redeemed FROM TokenLedgerEntry`);
      tokensAwarded = Number((tokenAgg as any[])[0]?.awarded ?? 0);
      tokensRedeemed = Number((tokenAgg as any[])[0]?.redeemed ?? 0);
    } catch {}

    // ---- Educational Metrics ----
    let totalLessons = 0, lessonsCompleted = 0, avgQuizScore = 0, quizAttempts = 0;
    try {
      const lessonAgg = await db.$queryRawUnsafe(`SELECT COUNT(*) as total FROM Lesson`);
      totalLessons = Number((lessonAgg as any[])[0]?.total ?? 0);

      const progressAgg = await db.$queryRawUnsafe(`SELECT COUNT(*) as completed FROM LessonProgress WHERE status = 'COMPLETED'`);
      lessonsCompleted = Number((progressAgg as any[])[0]?.completed ?? 0);

      const quizAgg = await db.$queryRawUnsafe(`SELECT COUNT(*) as attempts, COALESCE(AVG(score),0) as avg FROM QuizAttempt`);
      quizAttempts = Number((quizAgg as any[])[0]?.attempts ?? 0);
      avgQuizScore = Math.round(Number((quizAgg as any[])[0]?.avg ?? 0));
    } catch {}

    // ---- Family Metrics ----
    let totalChildren = 0, totalParents = 0;
    let avgSavingsPerChild = 0, totalFamilySavings = 0;
    try {
      const childAgg = await db.$queryRawUnsafe(`SELECT COUNT(*) as cnt, COALESCE(SUM(currentAmount),0) as total FROM Child`);
      totalChildren = Number((childAgg as any[])[0]?.cnt ?? 0);
      totalFamilySavings = Number((childAgg as any[])[0]?.total ?? 0);
      avgSavingsPerChild = totalChildren > 0 ? Math.round(totalFamilySavings / totalChildren) : 0;

      const parentAgg = await db.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM ParentProfile`);
      totalParents = Number((parentAgg as any[])[0]?.cnt ?? 0);
    } catch {}

    // ---- Achievement Metrics ----
    let totalBadgesEarned = 0, totalAchievements = 0;
    try {
      const badgeAgg = await db.$queryRawUnsafe(`SELECT COUNT(*) as earned FROM UserAchievement`);
      totalBadgesEarned = Number((badgeAgg as any[])[0]?.earned ?? 0);
      const achAgg = await db.$queryRawUnsafe(`SELECT COUNT(*) as total FROM Achievement`);
      totalAchievements = Number((achAgg as any[])[0]?.total ?? 0);
    } catch {}

    // ---- AI Metrics ----
    let coachQueries = 0;
    try {
      const coachAgg = await db.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM AnalyticsEvent WHERE event = 'coach_query'`);
      coachQueries = Number((coachAgg as any[])[0]?.cnt ?? 0);
    } catch {}

    // ---- Recent Events ----
    let recentEvents: { event: string; count: number }[] = [];
    try {
      const events = await db.$queryRawUnsafe(
        `SELECT event, COUNT(*) as count FROM AnalyticsEvent WHERE createdAt >= '${last30Days.toISOString()}' GROUP BY event ORDER BY count DESC`
      );
      recentEvents = (events as any[]).map((e) => ({ event: e.event, count: Number(e.count) }));
    } catch {}

    return NextResponse.json({
      product: {
        totalSaves, totalSaveAmount, savesThisMonth,
        spendingEntriesCount, totalSpending,
        totalGoals, completedGoals,
        goalCompletionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
        tokensAwarded, tokensRedeemed,
      },
      education: {
        totalLessons, lessonsCompleted,
        completionRate: totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0,
        quizAttempts, avgQuizScore,
      },
      family: {
        totalChildren, totalParents,
        totalFamilySavings, avgSavingsPerChild,
      },
      achievements: { totalBadgesEarned, totalAchievements },
      ai: { coachQueries },
      events: recentEvents,
      generatedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("GET /api/metrics failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
