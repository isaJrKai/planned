// GET /api/health — system health check with real DB metrics
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get row counts for all tables using raw SQL
    const tableNames = [
      "Child", "ParentProfile", "Account", "Transaction", "SpendingEntry",
      "SpendingCategory", "Investment", "TokenLedgerEntry", "Goal",
      "FamilySettings", "User", "Session", "AuditLog", "Notification",
      "FileUpload", "Achievement", "UserAchievement", "Lesson", "LessonProgress",
      "QuizAttempt", "Recommendation", "SavingStreak", "FeatureFlag",
      "FeatureFlagOverride", "AnalyticsEvent", "Configuration", "AdminAction",
      "FamilyCharter",
    ];

    const tables: { name: string; count: number }[] = [];
    let totalRecords = 0;

    for (const name of tableNames) {
      try {
        const result = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${name}"`);
        const count = (result as any[])[0]?.count ?? 0;
        tables.push({ name, count: Number(count) });
        totalRecords += Number(count);
      } catch {
        // Table might not exist — skip
      }
    }

    // Get feature flag counts
    let featureFlagsOn = 0;
    let featureFlagsTotal = 0;
    try {
      const flags = await db.$queryRawUnsafe(`SELECT COUNT(*) as total, SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) as on_count FROM FeatureFlag`);
      featureFlagsTotal = Number((flags as any[])[0]?.total ?? 0);
      featureFlagsOn = Number((flags as any[])[0]?.on_count ?? 0);
    } catch {}

    // Get recent analytics events (last 30 days)
    const recentEvents: { event: string; count: number }[] = [];
    try {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const events = await db.$queryRawUnsafe(
        `SELECT event, COUNT(*) as count FROM AnalyticsEvent WHERE createdAt >= '${since}' GROUP BY event ORDER BY count DESC`
      );
      for (const e of events as any[]) {
        recentEvents.push({ event: e.event, count: Number(e.count) });
      }
    } catch {}

    return NextResponse.json({
      status: "ok",
      tables,
      totalRecords,
      featureFlagsOn,
      featureFlagsTotal,
      recentEvents,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Health check failed:", err);
    return NextResponse.json({
      status: "degraded",
      tables: [],
      totalRecords: 0,
      featureFlagsOn: 0,
      featureFlagsTotal: 0,
      recentEvents: [],
      error: "Internal error",
    }, { status: 200 }); // Always 200 — health endpoint should never fail
  }
}
