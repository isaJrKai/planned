// GET /api/learning-paths — list paths with lessons + progress
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");

    let paths: any[] = [];
    try {
      paths = await db.learningPath.findMany({ orderBy: { createdAt: "asc" } });
    } catch {
      paths = await db.$queryRaw`SELECT * FROM LearningPath ORDER BY createdAt ASC`;
    }

    let lessons: any[] = [];
    try {
      lessons = await db.lesson.findMany({ orderBy: [{ learningPathId: "asc" }, { order: "asc" }] });
    } catch {
      lessons = await db.$queryRaw`SELECT * FROM Lesson ORDER BY learningPathId ASC, "order" ASC`;
    }

    let progressMap = new Map<string, string>();
    if (childId) {
      let progress: any[] = [];
      try {
        progress = await db.lessonProgress.findMany({ where: { userId: childId } });
      } catch {
        progress = await db.$queryRaw`SELECT * FROM LessonProgress WHERE userId = ${childId}`;
      }
      progressMap = new Map(progress.map((p: any) => [p.lessonId, p.status]));
    }

    const result = paths.map((path: any) => {
      const pathLessons = lessons
        .filter((l: any) => l.learningPathId === path.id)
        .map((l: any) => ({
          id: l.id, slug: l.slug, title: l.title, description: l.description,
          subject: l.subject, difficulty: l.difficulty, ageMin: l.ageMin, ageMax: l.ageMax,
          estimatedMinutes: l.estimatedMinutes, order: l.order,
          status: progressMap.get(l.id) ?? "NOT_STARTED",
        }));

      const completedCount = pathLessons.filter((l: any) => l.status === "COMPLETED").length;
      const completionRate = pathLessons.length > 0 ? Math.round((completedCount / pathLessons.length) * 100) : 0;

      return {
        id: path.id, slug: path.slug, title: path.title, description: path.description,
        subject: path.subject, icon: path.icon, lessons: pathLessons,
        completedCount, totalLessons: pathLessons.length, completionRate,
        certificateEarned: completionRate === 100,
      };
    });

    return NextResponse.json({ paths: result });
  } catch (err) {
    console.error("GET /api/learning-paths failed:", err);
    return NextResponse.json({ paths: [] });
  }
}
