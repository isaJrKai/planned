import { z } from "zod";
import { db } from "@/db";
import { journalEntries } from "@/db/schema";
import { handler, ok, parseBody, rateLimit } from "@/lib/api";
import { requireViewer } from "@/lib/auth";
import { evaluateAchievements } from "@/lib/achievements";

export const POST = handler(async (req) => {
  const v = await requireViewer();
  rateLimit(`journal:${v.member.id}`, 30, 60 * 60 * 1000);
  const body = await parseBody(req, z.object({ body: z.string().trim().min(2, "Write a little more.").max(1000), prompt: z.string().max(200).optional(), visibleToParents: z.boolean().default(true) }));
  const [e] = await db.insert(journalEntries).values({ memberId: v.member.id, body: body.body, prompt: body.prompt ?? null, visibleToParents: body.visibleToParents }).returning();
  const earned = await evaluateAchievements(v.member.id);
  return ok({ entry: e, earned }, { status: 201 });
});
