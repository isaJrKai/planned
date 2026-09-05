import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lessonCompletions } from "@/db/schema";
import { requireViewer } from "@/lib/auth";
import { lessonBySlug, levelUnlocked } from "@/lib/lessons";
import { LessonPlayer } from "@/components/me/Actions";
import { Pill } from "@/components/ui";

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const v = await requireViewer();
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (!lesson) notFound();
  const done = new Set((await db.select().from(lessonCompletions).where(eq(lessonCompletions.memberId, v.member.id))).map((d) => d.lessonSlug));
  if (!levelUnlocked(lesson.level, done)) redirect("/me/learn");
  return (
    <article className="rise max-w-2xl">
      <Link href="/me/learn" className="text-[14px] text-ink-3 hover:text-ink">← Learn</Link>
      <div className="mt-3 flex items-center gap-2"><Pill tone="grow">Level {lesson.level}</Pill><span className="text-[13px] text-ink-3">{lesson.minutes} min</span>{done.has(slug) && <Pill tone="save">Done</Pill>}</div>
      <h1 className="text-[32px] font-semibold leading-tight mt-2">{lesson.title}</h1>
      <p className="text-[17px] text-ink-2 mt-2 mb-8">{lesson.summary}</p>
      <LessonPlayer lesson={lesson} done={done.has(slug)} />
    </article>
  );
}
