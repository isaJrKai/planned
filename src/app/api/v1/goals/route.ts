import { db } from "@/lib/db";
import { apiResponse, apiError } from "../_shared";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const goals = await db.goal.findMany({ orderBy: { createdAt: "desc" } });
    return apiResponse({ goals: goals.map(g => ({
      id: g.id, ownerId: g.ownerId, ownerKind: g.ownerKind, ownerName: g.ownerName,
      title: g.title, type: g.type, cadence: g.cadence, visibility: g.visibility,
      targetAmount: g.targetAmount, currentAmount: g.currentAmount,
      progressPct: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
      note: g.note,
    }))});
  } catch { return apiError("Failed to fetch goals", 500); }
}
