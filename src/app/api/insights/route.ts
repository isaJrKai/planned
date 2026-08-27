// GET /api/insights — intelligent summaries for parents
import { NextResponse } from "next/server";
import { InsightsEngine } from "@/server/services/insights.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const insights = await InsightsEngine.generateForFamily();
    return NextResponse.json({ insights });
  } catch (err) {
    console.error("GET /api/insights failed:", err);
    return NextResponse.json({ insights: [] });
  }
}
