// GET /api/maturity?childId=zara — financial maturity score
import { NextRequest, NextResponse } from "next/server";
import { MaturityService } from "@/server/services/maturity.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return NextResponse.json({ error: "childId required" }, { status: 400 });
    }

    const score = await MaturityService.calculate(childId);
    return NextResponse.json(score);
  } catch (err) {
    console.error("GET /api/maturity failed:", err);
    return NextResponse.json({ error: "Failed to calculate maturity" }, { status: 500 });
  }
}
