import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { memberAchievements, transactions, goals, lessonCompletions, journalEntries } from "@/db/schema";

export const ACHIEVEMENTS = [
  { key: "first_save", title: "First save", desc: "Moved money into savings for the first time." },
  { key: "first_goal", title: "Goal setter", desc: "Created a first goal." },
  { key: "goal_complete", title: "Goal reached", desc: "Finished a goal all the way to 100%." },
  { key: "four_week_streak", title: "Four weeks steady", desc: "Saved something in four consecutive weeks." },
  { key: "first_lesson", title: "Curious", desc: "Completed a first lesson." },
  { key: "level_1", title: "Money basics", desc: "Finished every Level 1 lesson." },
  { key: "level_2", title: "Money manager", desc: "Finished every Level 2 lesson." },
  { key: "reflector", title: "Thoughtful", desc: "Wrote three journal entries." },
  { key: "family_contributor", title: "Team player", desc: "Contributed to a shared family goal." },
] as const;
export type AchievementKey = (typeof ACHIEVEMENTS)[number]["key"];

/** Detect milestones from real data and award any new ones. Returns newly earned keys. */
export async function evaluateAchievements(memberId: string): Promise<AchievementKey[]> {
  const have = new Set((await db.select({ key: memberAchievements.key }).from(memberAchievements).where(eq(memberAchievements.memberId, memberId))).map((r) => r.key));
  const earned: AchievementKey[] = [];
  const award = async (key: AchievementKey) => {
    if (have.has(key)) return;
    await db.insert(memberAchievements).values({ memberId, key }).onConflictDoNothing();
    earned.push(key);
  };
  const tx = await db.select().from(transactions).where(and(eq(transactions.memberId, memberId), eq(transactions.status, "posted")));
  const saves = tx.filter((t) => t.kind === "goal_contribution" || (t.kind === "transfer" && (t.metadata as { toKind?: string } | null)?.toKind === "savings"));
  if (saves.length) await award("first_save");
  const weeks = new Set(saves.map((t) => Math.floor(t.createdAt.getTime() / (7 * 86400000))));
  const nowWeek = Math.floor(Date.now() / (7 * 86400000));
  if ([0, 1, 2, 3].every((w) => weeks.has(nowWeek - w))) await award("four_week_streak");
  const [{ gcount }] = await db.select({ gcount: sql<number>`count(*)::int` }).from(goals).where(eq(goals.memberId, memberId));
  if (gcount > 0) await award("first_goal");
  const [{ done }] = await db.select({ done: sql<number>`count(*)::int` }).from(goals).where(and(eq(goals.memberId, memberId), eq(goals.status, "completed")));
  if (done > 0) await award("goal_complete");
  if (tx.some((t) => t.kind === "goal_contribution" && (t.metadata as { shared?: boolean } | null)?.shared)) await award("family_contributor");
  const lessons = (await db.select({ slug: lessonCompletions.lessonSlug }).from(lessonCompletions).where(eq(lessonCompletions.memberId, memberId))).map((r) => r.slug);
  if (lessons.length) await award("first_lesson");
  const { LESSONS } = await import("./lessons");
  if (LESSONS.filter((l) => l.level === 1).every((l) => lessons.includes(l.slug))) await award("level_1");
  if (LESSONS.filter((l) => l.level === 2).every((l) => lessons.includes(l.slug))) await award("level_2");
  const [{ jcount }] = await db.select({ jcount: sql<number>`count(*)::int` }).from(journalEntries).where(eq(journalEntries.memberId, memberId));
  if (jcount >= 3) await award("reflector");
  return earned;
}
