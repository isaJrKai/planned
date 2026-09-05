import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { goals, accounts, transactions } from "@/db/schema";
import { handler, ok, parseBody, errors } from "@/lib/api";
import { requireViewer, assertCanActOn } from "@/lib/auth";
import { forecastGoal } from "@/lib/goals";
import { audit } from "@/lib/audit";
import { postTransaction } from "@/lib/ledger";
import { memberAccounts } from "@/lib/family";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler<Ctx>(async (_req, { params }) => {
  const v = await requireViewer();
  const { id } = await params;
  const [row] = await db.select({ goal: goals, account: accounts }).from(goals).innerJoin(accounts, eq(accounts.id, goals.accountId)).where(and(eq(goals.id, id), eq(goals.familyId, v.family.id))).limit(1);
  if (!row) throw errors.notFound("That goal");
  if (row.goal.memberId) assertCanActOn(v, row.goal.memberId);
  const history = await db.select().from(transactions).where(and(eq(transactions.goalId, id), eq(transactions.status, "posted")));
  return ok({ ...row.goal, saved: row.account.balance, forecast: forecastGoal(row.goal.targetAmount, row.account.balance, history), history });
});

export const PATCH = handler<Ctx>(async (req, { params }) => {
  const v = await requireViewer();
  const { id } = await params;
  const body = await parseBody(req, z.object({ status: z.enum(["archived", "active"]).optional(), name: z.string().trim().min(2).max(60).optional(), targetAmount: z.number().int().positive().optional() }));
  const [g] = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.familyId, v.family.id))).limit(1);
  if (!g) throw errors.notFound("That goal");
  if (g.memberId) assertCanActOn(v, g.memberId); else if (v.member.role !== "parent") throw errors.forbidden();
  if (body.status === "archived") {
    // Archiving returns any saved money to the owner's savings (or the family pool for shared goals).
    await db.transaction(async (tx) => {
      const [acct] = await tx.select().from(accounts).where(eq(accounts.id, g.accountId)).limit(1);
      if (acct && acct.balance > 0) {
        let dest: string;
        if (g.memberId) dest = (await memberAccounts(v.family.id, g.memberId)).savings.id;
        else { const [pool] = await tx.select().from(accounts).where(and(eq(accounts.familyId, v.family.id), eq(accounts.kind, "family_pool"))).limit(1); dest = pool.id; }
        await postTransaction({ familyId: v.family.id, kind: "goal_withdrawal", amount: acct.balance, currency: acct.currency, fromAccountId: acct.id, toAccountId: dest, memberId: g.memberId, goalId: g.id, description: `Closed goal: ${g.name}`, idempotencyKey: `archive:${g.id}`, createdBy: v.user.id }, tx);
      }
      await tx.update(goals).set({ status: "archived" }).where(eq(goals.id, g.id));
      await tx.update(accounts).set({ closedAt: new Date() }).where(eq(accounts.id, g.accountId));
      await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "goal.archived", targetType: "goal", targetId: g.id }, req, tx);
    });
    return ok({ status: "archived" });
  }
  const patch: Partial<typeof g> = {};
  if (body.name) patch.name = body.name;
  if (body.targetAmount) patch.targetAmount = body.targetAmount;
  const [updated] = await db.update(goals).set(patch).where(eq(goals.id, g.id)).returning();
  await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "goal.updated", targetType: "goal", targetId: g.id, details: patch }, req);
  return ok(updated);
});
