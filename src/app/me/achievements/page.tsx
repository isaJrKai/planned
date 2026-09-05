import { Award } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberAchievements } from "@/db/schema";
import { requireViewer } from "@/lib/auth";
import { ACHIEVEMENTS, evaluateAchievements } from "@/lib/achievements";
import { PageHeader } from "@/components/app/Shell";
import { relDate } from "@/lib/format";

export const metadata = { title: "Achievements" };
export default async function Achievements() {
  const v = await requireViewer();
  await evaluateAchievements(v.member.id);
  const earned = await db.select().from(memberAchievements).where(eq(memberAchievements.memberId, v.member.id));
  const map = new Map(earned.map((e) => [e.key, e.earnedAt]));
  return (
    <div className="rise max-w-3xl">
      <PageHeader title="Achievements" sub="These come from things you actually did — not from tapping buttons." />
      <ul className="grid sm:grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const at = map.get(a.key);
          return (
            <li key={a.key} className={`border rounded-lg p-4 flex gap-3 ${at ? "border-line" : "border-dashed border-line opacity-60"}`}>
              <span className={`h-10 w-10 rounded-full grid place-items-center shrink-0 ${at ? "bg-grow-soft text-grow" : "bg-warm-2 text-ink-4"}`}><Award className="h-5 w-5" /></span>
              <div><p className="font-medium">{a.title}</p><p className="text-[14px] text-ink-2">{a.desc}</p>{at && <p className="text-[12.5px] text-ink-3 mt-1">Earned {relDate(at)}</p>}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
