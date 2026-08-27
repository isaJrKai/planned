import { db } from "@/lib/db";
import { apiResponse, apiError } from "../_shared";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const settings = await db.familySettings.findFirst();
    const children = await db.child.findMany();
    const parents = await db.parentProfile.findMany();
    return apiResponse({
      family: {
        id: "singleton",
        name: "Planned Family",
        annualTheme: settings?.annualTheme ?? "",
        monthlyQuote: settings?.monthlyQuote ?? "",
        currency: settings?.currency ?? "UGX",
        members: {
          parents: parents.map(p => ({ id: p.id, name: p.name, role: p.role, avatarPhoto: p.avatarPhoto })),
          children: children.map(c => ({ id: c.id, name: c.name, age: c.age, currentAmount: c.currentAmount, goalAmount: c.goalAmount, goalName: c.goalName })),
        },
      },
    });
  } catch { return apiError("Failed to fetch family", 500); }
}
