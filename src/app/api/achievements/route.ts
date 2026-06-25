// GET /api/achievements — list all achievements + earned for a user
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");

    // Get all achievements with raw SQL fallback
    let achievements: any[] = [];
    try {
      achievements = await db.achievement.findMany({
        orderBy: [{ category: "asc" }, { tier: "asc" }],
      });
    } catch {
      achievements = await db.$queryRaw`SELECT * FROM Achievement ORDER BY category ASC, tier ASC`;
    }

    // Get earned achievements for this user
    let earned: any[] = [];
    if (childId) {
      try {
        earned = await db.userAchievement.findMany({
          where: { userId: childId },
          include: { achievement: true },
          orderBy: { earnedAt: "desc" },
        });
      } catch {
        earned = await db.$queryRaw`
          SELECT ua.*, a.* FROM UserAchievement ua
          JOIN Achievement a ON ua.achievementId = a.id
          WHERE ua.userId = ${childId}
          ORDER BY ua.earnedAt DESC
        `;
      }
    }

    // Get streak
    let streak: any = null;
    if (childId) {
      try {
        streak = await db.savingStreak.findUnique({ where: { childId } });
      } catch {
        const streakRows = await db.$queryRaw`SELECT * FROM SavingStreak WHERE childId = ${childId}`;
        streak = (streakRows as any[])[0] ?? null;
      }
    }

    // Calculate total points
    const totalPoints = earned.reduce((sum: number, e: any) => {
      const ach = achievements.find((a) => a.id === e.achievementId);
      return sum + (ach?.points ?? 0);
    }, 0);

    // Format achievements
    const formattedAchievements = achievements.map((a: any) => ({
      id: a.id,
      code: a.code,
      title: a.title,
      description: a.description,
      icon: a.icon,
      category: a.category,
      tier: a.tier,
      points: a.points,
      requirement: typeof a.requirement === "string" ? JSON.parse(a.requirement) : a.requirement,
    }));

    const formattedEarned = earned.map((e: any) => {
      const ach = achievements.find((a) => a.id === (e.achievementId ?? e.achievement?.id));
      return {
        id: e.id,
        achievementId: e.achievementId ?? e.achievement?.id,
        achievement: ach ? {
          id: ach.id,
          code: ach.code,
          title: ach.title,
          description: ach.description,
          icon: ach.icon,
          category: ach.category,
          tier: ach.tier,
          points: ach.points,
          requirement: typeof ach.requirement === "string" ? JSON.parse(ach.requirement) : ach.requirement,
        } : null,
        earnedAt: e.earnedAt instanceof Date ? e.earnedAt.getTime() : e.earnedAt,
      };
    }).filter((e: any) => e.achievement !== null);

    return NextResponse.json({
      achievements: formattedAchievements,
      earned: formattedEarned,
      totalPoints,
      streak: streak ? {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastSaveDate: streak.lastSaveDate?.getTime?.() ?? streak.lastSaveDate,
        daysUntilBreak: 0,
      } : null,
    });
  } catch (err) {
    console.error("GET /api/achievements failed:", err);
    return NextResponse.json({ achievements: [], earned: [], totalPoints: 0, streak: null });
  }
}
