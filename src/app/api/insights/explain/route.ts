import { z } from "zod";
import { handler, ok, parseBody, rateLimit } from "@/lib/api";
import { requireViewer } from "@/lib/auth";
import { interpret } from "@/lib/ai";
import { familyPulse } from "@/lib/insights";

/** The coach explains numbers the app computed. It receives only server-derived context. */
export const POST = handler(async (req) => {
  const v = await requireViewer();
  rateLimit(`explain:${v.user.id}`, 20, 60 * 60 * 1000);
  const { topic, question } = await parseBody(req, z.object({ topic: z.enum(["pulse", "goal", "spending"]), question: z.string().trim().min(3).max(300), goalId: z.string().uuid().optional() }));
  const p = await familyPulse(v.family.id);
  const ctx: Record<string, unknown> = { currency: v.family.currency, health: p.label, savedThisMonth: p.savedThisMonth, savedLastMonth: p.savedLastMonth, spentThisMonth: p.spentThisMonth, spentLastMonth: p.spentLastMonth, totalSavings: p.totalSavings, activeGoals: p.activeGoals, childrenSavingThisMonth: `${p.childrenSaving} of ${p.childrenTotal}`, notes: p.notes.join(" ") };
  void topic;
  const r = await interpret(v.family.id, question, ctx, v.member.role);
  return ok(r);
});
