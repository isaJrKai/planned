import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lessonCompletions } from "@/db/schema";
import { requireViewer } from "@/lib/auth";
import { LESSONS, LEVELS, levelUnlocked } from "@/lib/lessons";
import { PageHeader } from "@/components/app/Shell";

export const metadata = { title: "Learn" };
export default async function Learn() {
  const v = await requireViewer();
  const done = new Set((await db.select().from(lessonCompletions).where(eq(lessonCompletions.memberId, v.member.id))).map((d) => d.lessonSlug));
  return (
    <div className="rise max-w-3xl">
      <PageHeader title="Learn" sub={`Four levels, sixteen short lessons. ${done.size} done. Each one ends with something to try for real.`} />
      <div className="space-y-12">
        {LEVELS.map((lv) => {
          const unlocked = levelUnlocked(lv.level, done);
          const lessons = LESSONS.filter((l) => l.level === lv.level);
          const count = lessons.filter((l) => done.has(l.slug)).length;
          return (
            <section key={lv.level} aria-labelledby={`lv-${lv.level}`}>
              <div className="flex items-baseline gap-3 mb-1"><h2 id={`lv-${lv.level}`} className="text-[20px] font-semibold">Level {lv.level} — {lv.name}</h2><span className="text-[13.5px] text-ink-3 tnum">{count}/{lessons.length}</span>{!unlocked && <Lock className="h-4 w-4 text-ink-4" aria-label="Locked" />}</div>
              <p className="text-[14.5px] text-ink-2 mb-4">{unlocked ? lv.blurb : `Finish Level ${lv.level - 1} to unlock.`}</p>
              <ul className={`divide-y divide-line border-y border-line ${unlocked ? "" : "opacity-50"}`}>
                {lessons.map((l) => (
                  <li key={l.slug}>
                    {unlocked ? (
                      <Link href={`/me/learn/${l.slug}`} className="flex items-center gap-3 py-3 hover:bg-warm -mx-3 px-3 rounded-md">
                        <span className={`h-6 w-6 rounded-full grid place-items-center shrink-0 ${done.has(l.slug) ? "bg-save text-white" : "border border-line-strong"}`}>{done.has(l.slug) && <Check className="h-3.5 w-3.5" />}</span>
                        <span className="flex-1 min-w-0"><span className="font-medium">{l.title}</span><span className="block text-[13.5px] text-ink-3 truncate">{l.summary}</span></span>
                        <span className="text-[13px] text-ink-3 shrink-0">{l.minutes} min</span>
                      </Link>
                    ) : <div className="flex items-center gap-3 py-3"><span className="h-6 w-6 rounded-full border border-line-strong shrink-0" /><span className="font-medium">{l.title}</span></div>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
