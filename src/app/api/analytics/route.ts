// GET /api/analytics — event counts + DAU
import { NextResponse } from "next/server";
import { AnalyticsService } from "@/server/services/analytics.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const [eventCounts, dau] = await Promise.all([
    AnalyticsService.getEventCounts(30),
    AnalyticsService.getDailyActiveUsers(30),
  ]);
  return NextResponse.json({ eventCounts, dau, period: "30 days" });
}
