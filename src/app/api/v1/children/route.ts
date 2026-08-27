import { db } from "@/lib/db";
import { apiResponse, apiError } from "../_shared";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const children = await db.child.findMany();
    return apiResponse({ children: children.map(c => ({
      id: c.id, name: c.name, age: c.age, avatarColor: c.avatarColor,
      avatarPhoto: c.avatarPhoto, currentAmount: c.currentAmount,
      goalAmount: c.goalAmount, goalName: c.goalName,
    }))});
  } catch { return apiError("Failed to fetch children", 500); }
}
