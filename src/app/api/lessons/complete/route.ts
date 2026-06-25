// POST /api/lessons/complete — submit quiz answers + mark lesson complete
import { NextRequest, NextResponse } from "next/server";
import { EducationService } from "@/server/services/education.service";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const completeSchema = z.object({
  childId: z.string(),
  lessonId: z.string(),
  answers: z.array(z.number()),
  timeSpentSec: z.number().int().min(0).default(0),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await req.json();
    const input = completeSchema.parse(body);

    const result = await EducationService.completeLesson(
      input.childId,  // For MVP, childId is used as userId
      input.lessonId,
      input.answers,
      input.timeSpentSec,
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/lessons/complete failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to complete lesson" },
      { status: 500 },
    );
  }
}
