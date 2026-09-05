import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { goals, approvalRequests } from "@/db/schema";
import { handler, ok, parseBody, errors, idempotencyKeyFrom } from "@/lib/api";
import { requireViewer, assertCanActOn } from "@/lib/auth";
import { postTransaction } from "@/lib/ledger";
import { memberAccounts, getRules } from "@/lib/family";

export const POST = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const v = await requireViewer();
  const { id } = await params;
  const { amount, reason } = await parseBody(req, z.object({ amount: z.number().int().positive(), reason: z.string().trim().min(2).max(160) }));
  const [g] = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.familyId, v.family.id))).limit(1);
  if (!g || !g.memberId) throw errors.notFound("That goal");
  assertCanActOn(v, g.memberId);
  const rules = await getRules(v.family.id);
  if (v.member.role === "child" && rules.goalWithdrawalNeedsApproval) {
    const [r] = await db.insert(approvalRequests).values({ familyId: v.family.id, memberId: g.memberId, type: "goal_withdrawal", amount, reason, goalId: g.id }).returning();
    return ok({ requiresApproval: true, requestId: r.id }, { status: 202 });
  }
  const accts = await memberAccounts(v.family.id, g.memberId);
  const r = await postTransaction({ familyId: v.family.id, kind: "goal_withdrawal", amount, currency: v.family.currency, fromAccountId: g.accountId, toAccountId: accts.spending.id, memberId: g.memberId, goalId: g.id, description: `Withdrew from ${g.name}: ${reason}`, idempotencyKey: idempotencyKeyFrom(req), createdBy: v.user.id });
  return ok(r);
});
