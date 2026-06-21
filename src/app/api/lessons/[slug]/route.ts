// GET /api/lessons/[slug] — get single lesson
import { NextRequest, NextResponse } from "next/server";
import { EducationService } from "@/server/services/education.service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const lesson = await EducationService.getLesson(slug);
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    return NextResponse.json({ lesson });
  } catch (err) {
    console.error("GET /api/lessons/[slug] failed:", err);
    return NextResponse.json({ error: "Failed to load lesson" }, { status: 500 });
  }
}
