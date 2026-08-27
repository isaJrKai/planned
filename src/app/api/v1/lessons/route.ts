import { db } from "@/lib/db";
import { apiResponse, apiError } from "../_shared";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    let lessons: any[] = [];
    try { lessons = await db.lesson.findMany({ orderBy: { order: "asc" } }); }
    catch { lessons = await db.$queryRaw`SELECT * FROM Lesson ORDER BY "order" ASC`; }
    return apiResponse({ lessons: lessons.map((l: any) => ({
      id: l.id, slug: l.slug, title: l.title, description: l.description,
      subject: l.subject, difficulty: l.difficulty, ageMin: l.ageMin,
      ageMax: l.ageMax, estimatedMinutes: l.estimatedMinutes, order: l.order,
    }))});
  } catch { return apiError("Failed to fetch lessons", 500); }
}
