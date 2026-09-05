import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { handler, ok, parseBody, errors, idempotencyKeyFrom } from "@/lib/api";
import { requireViewer, assertCanActOn } from "@/lib/auth";
import { postTransaction } from "@/lib/ledger";
import { memberAccounts, familyPool } from "@/lib/family";
import { evaluateAchievements } from "@/lib/achievements";

const schema = z.object({ amount: z.number().int().positive(), from: z.enum(["spending", "savings", "family_pool"]) });

export const POST = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const v = await requireViewer();
  const { id } = await params;
  const { amount, from } = await parseBody(req, schema);
  const key = idempotencyKeyFrom(req);
  const [g] = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.familyId, v.family.id))).limit(1);
  if (!g) throw errors.notFound("That goal");
  if (g.status !== "active") throw errors.conflict("This goal is no longer active.");
  let fromId: string;
  let memberId: string | null = v.member.id;
  if (from === "family_pool") {
    if (v.member.role !== "parent") throw errors.forbidden("Only parents can contribute from the family pool.");
    fromId = (await familyPool(v.family.id)).id;
    memberId = g.memberId;
  } else {
    if (g.memberId) assertCanActOn(v, g.memberId);
    const owner = g.memberId ?? v.member.id; // shared goals: contributor's own accounts
    if (v.member.role === "child" && g.memberId && g.memberId !== v.member.id) throw errors.forbidden();
    const accts = await memberAccounts(v.family.id, v.member.role === "child" ? v.member.id : owner);
    fromId = accts[from].id;
    memberId = v.member.role === "child" ? v.member.id : owner;
  }
  const r = await postTransaction({ familyId: v.family.id, kind: "goal_contribution", amount, currency: v.family.currency, fromAccountId: fromId, toAccountId: g.accountId, memberId, goalId: g.id, description: `Saved toward ${g.name}`, idempotencyKey: key, createdBy: v.user.id, metadata: { shared: g.isShared, from } });
  if (memberId) await evaluateAchievements(memberId);
  return ok(r);
});
