import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lessonCompletions } from "@/db/schema";
import { handler, ok, parseBody, errors } from "@/lib/api";
import { requireViewer } from "@/lib/auth";
import { lessonBySlug, levelUnlocked } from "@/lib/lessons";
import { evaluateAchievements } from "@/lib/achievements";
import { audit } from "@/lib/audit";

export const POST = handler<{ params: Promise<{ slug: string }> }>(async (req, { params }) => {
  const v = await requireViewer();
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (!lesson) throw errors.notFound("That lesson");
  const { answer, reflection } = await parseBody(req, z.object({ answer: z.number().int().min(0).max(5), reflection: z.string().trim().max(500).optional() }));
  const done = new Set((await db.select({ s: lessonCompletions.lessonSlug }).from(lessonCompletions).where(eq(lessonCompletions.memberId, v.member.id))).map((r) => r.s));
  if (!levelUnlocked(lesson.level, done)) throw errors.forbidden("Finish the previous level first.");
  const correct = answer === lesson.question.answer;
  await db.insert(lessonCompletions).values({ memberId: v.member.id, lessonSlug: slug, score: correct ? 100 : 50, reflection: reflection || null })
    .onConflictDoUpdate({ target: [lessonCompletions.memberId, lessonCompletions.lessonSlug], set: { reflection: reflection || null } });
  const earned = await evaluateAchievements(v.member.id);
  await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "lesson.completed", targetType: "lesson", targetId: slug, details: { correct } }, req);
  return ok({ correct, why: lesson.question.why, earned });
});
