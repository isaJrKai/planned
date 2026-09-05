import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { approvalRequests, goals } from "@/db/schema";
import { handler, ok, parseBody, errors } from "@/lib/api";
import { requireParent } from "@/lib/auth";
import { postTransaction } from "@/lib/ledger";
import { familyPool, memberAccounts } from "@/lib/family";
import { audit } from "@/lib/audit";

/** Resolve a request. The money movement is keyed on the request id so it can only ever happen once. */
export const POST = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const v = await requireParent();
  const { id } = await params;
  const { decision, note } = await parseBody(req, z.object({ decision: z.enum(["approved", "declined"]), note: z.string().trim().max(200).optional() }));
  const result = await db.transaction(async (tx) => {
    const [r] = await tx.select().from(approvalRequests).where(and(eq(approvalRequests.id, id), eq(approvalRequests.familyId, v.family.id))).for("update");
    if (!r) throw errors.notFound("That request");
    if (r.status !== "pending") throw errors.conflict("This request was already decided.");
    if (decision === "approved") {
      const accts = await memberAccounts(v.family.id, r.memberId);
      if (r.type === "money_request") {
        const pool = await familyPool(v.family.id);
        await postTransaction({ familyId: v.family.id, kind: "transfer", amount: r.amount, currency: v.family.currency, fromAccountId: pool.id, toAccountId: accts.spending.id, memberId: r.memberId, description: `Approved request: ${r.reason}`, idempotencyKey: `request:${r.id}`, createdBy: v.user.id, metadata: { requestId: r.id, toKind: "spending" } }, tx);
      } else if (r.type === "goal_withdrawal" && r.goalId) {
        const [g] = await tx.select().from(goals).where(eq(goals.id, r.goalId)).limit(1);
        if (!g) throw errors.notFound("That goal");
        await postTransaction({ familyId: v.family.id, kind: "goal_withdrawal", amount: r.amount, currency: v.family.currency, fromAccountId: g.accountId, toAccountId: accts.spending.id, memberId: r.memberId, goalId: g.id, description: `Approved withdrawal from ${g.name}: ${r.reason}`, idempotencyKey: `request:${r.id}`, createdBy: v.user.id }, tx);
      } else if (r.type === "purchase") {
        await postTransaction({ familyId: v.family.id, kind: "spend", amount: r.amount, currency: v.family.currency, fromAccountId: accts.spending.id, memberId: r.memberId, description: `Approved purchase: ${r.reason}`, category: "Other", idempotencyKey: `request:${r.id}`, createdBy: v.user.id }, tx);
      }
    }
    const [updated] = await tx.update(approvalRequests).set({ status: decision, resolvedBy: v.user.id, resolvedAt: new Date(), resolutionNote: note ?? null }).where(eq(approvalRequests.id, r.id)).returning();
    await audit({ familyId: v.family.id, actorUserId: v.user.id, action: `request.${decision}`, targetType: "request", targetId: r.id, details: { amount: r.amount, type: r.type } }, req, tx);
    return updated;
  });
  return ok(result);
});
