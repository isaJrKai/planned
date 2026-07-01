// GET /api/recommendations — get smart suggestions for parent or child
import { NextRequest, NextResponse } from "next/server";
import { RecommendationService } from "@/server/services/recommendation.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
