// GET /api/lessons — list all lessons with progress for a user
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");

    // Use raw query as fallback if Prisma client doesn't have lesson model yet
    let lessons: any[] = [];
    try {
      lessons = await db.lesson.findMany({ orderBy: { order: "asc" } });
    } catch {
      // Fallback to raw SQL
      lessons = await db.$queryRaw`
        SELECT * FROM Lesson ORDER BY "order" ASC
      `;
    }

    // Get progress for this user
    let progressRows: any[] = [];
    try {
      if (childId) {
        progressRows = await db.lessonProgress.findMany({
          where: { userId: childId },
        });
      }
    } catch {
      // Fallback to raw SQL
      if (childId) {
        progressRows = await db.$queryRaw`
          SELECT * FROM LessonProgress WHERE userId = ${childId}
        `;
      }
    }

    const progressMap = new Map(progressRows.map((p: any) => [p.lessonId, p]));

    const formattedLessons = lessons.map((l: any) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      description: l.description,
      subject: l.subject,
      difficulty: l.difficulty,
      ageMin: l.ageMin,
      ageMax: l.ageMax,
      estimatedMinutes: l.estimatedMinutes,
      content: l.content,
      quiz: l.quiz ? (typeof l.quiz === "string" ? JSON.parse(l.quiz) : l.quiz) : [],
      order: l.order,
      status: progressMap.get(l.id)?.status ?? "NOT_STARTED",
    }));

    const completed = formattedLessons.filter((l: any) => l.status === "COMPLETED").length;
    const total = formattedLessons.length;

    return NextResponse.json({
      lessons: formattedLessons,
      progress: {
        total,
        completed,
        inProgress: 0,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
        averageScore: 0,
      },
    });
  } catch (err) {
    console.error("GET /api/lessons failed:", err);
    return NextResponse.json({ error: "Failed to load lessons", lessons: [], progress: {} }, { status: 500 });
  }
}
