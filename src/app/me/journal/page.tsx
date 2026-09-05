import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { journalEntries } from "@/db/schema";
import { requireViewer } from "@/lib/auth";
import { PageHeader } from "@/components/app/Shell";
import { JournalForm } from "@/components/me/Actions";
import { relDate } from "@/lib/format";

export const metadata = { title: "Journal" };
const PROMPTS = [
  "If you suddenly received a million shillings, what would you do with it?",
  "What's something you wanted last month that you don't care about now?",
  "Describe a time you chose to save instead of spend. How did it feel later?",
  "What's one thing about money you don't understand yet?",
  "Who do you know that's good with money? What do they do differently?",
  "What would you tell a younger kid about allowance?",
  "What's the best thing you've ever bought? Why?",
];
export default async function Journal() {
  const v = await requireViewer();
  const entries = await db.select().from(journalEntries).where(eq(journalEntries.memberId, v.member.id)).orderBy(desc(journalEntries.createdAt)).limit(30);
  const prompt = PROMPTS[Math.floor(Date.now() / 86400000) % PROMPTS.length];
  return (
    <div className="rise max-w-2xl">
      <PageHeader title="Journal" sub="Thoughts about money, kept over time. In a year, you'll be surprised what changed." />
      <div className="border border-line rounded-lg p-5 bg-warm"><p className="text-[13px] font-medium text-ink-3 uppercase tracking-wide mb-2">Today&rsquo;s prompt</p><JournalForm prompt={prompt} /></div>
      <section className="mt-10">
        {entries.length ? <ul className="space-y-6">{entries.map((e) => <li key={e.id}>{e.prompt && <p className="text-[13.5px] text-ink-3 mb-1">{e.prompt}</p>}<p className="text-[15.5px] leading-relaxed">{e.body}</p><p className="text-[12.5px] text-ink-3 mt-1">{relDate(e.createdAt)}{e.visibleToParents ? "" : " · private"}</p></li>)}</ul> : <p className="text-[14.5px] text-ink-3">No entries yet. The first one can be two sentences.</p>}
      </section>
    </div>
  );
}
