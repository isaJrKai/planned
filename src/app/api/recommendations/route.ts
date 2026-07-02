// GET /api/recommendations
import { NextRequest, NextResponse } from "next/server";
import { RecommendationService } from "@/server/services/recommendation.service";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");
    const familyId = searchParams.get("familyId") ?? "singleton";

    let recommendations;
    if (childId) {
      recommendations = await RecommendationService.forChild(childId);
    } else {
      recommendations = await RecommendationService.forParent(familyId);
    }

    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error("GET /api/recommendations failed:", err);
    return NextResponse.json({ recommendations: [] });
  }
}
