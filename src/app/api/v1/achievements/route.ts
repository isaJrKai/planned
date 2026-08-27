import { db } from "@/lib/db";
import { apiResponse, apiError } from "../_shared";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    let achievements: any[] = [];
    try { achievements = await db.achievement.findMany(); }
    catch { achievements = await db.$queryRaw`SELECT * FROM Achievement`; }
    return apiResponse({ achievements: achievements.map((a: any) => ({
      id: a.id, code: a.code, title: a.title, description: a.description,
      icon: a.icon, category: a.category, tier: a.tier, points: a.points,
    }))});
  } catch { return apiError("Failed to fetch achievements", 500); }
}
