import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { allowanceRules, goals, type AllowanceRule } from "@/db/schema";
import { postTransaction } from "./ledger";
import { familyPool, memberAccounts } from "./family";
import { errors } from "./api";

/** A stable key for the period a payment belongs to, so retries and double taps can't double pay. */
export function periodKey(rule: Pick<AllowanceRule, "cadence">, date: Date) {
  if (rule.cadence === "monthly") return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function nextDue(cadence: "weekly" | "monthly", dayOfPeriod: number, from = new Date()) {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 8));
  if (cadence === "weekly") {
    const diff = (dayOfPeriod - d.getUTCDay() + 7) % 7 || 7;
    d.setUTCDate(d.getUTCDate() + diff);
    return d;
  }
  const candidate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), Math.min(dayOfPeriod, 28), 8));
  if (candidate <= d) candidate.setUTCMonth(candidate.getUTCMonth() + 1);
  return candidate;
}

/**
 * Pay one allowance for a given period. Splits into spending / savings / goal according to the rule.
 * Idempotent per (rule, period). Returns what happened.
 */
export async function payAllowance(rule: AllowanceRule, actorUserId: string | null, period: string, opts: { manual?: boolean } = {}) {
  if (rule.savePercent + rule.goalPercent > 100) throw errors.badRequest("Allowance split exceeds 100%.");
  const pool = await familyPool(rule.familyId);
  const accts = await memberAccounts(rule.familyId, rule.memberId);
  const goalAmt = rule.goalId ? Math.floor((rule.amount * rule.goalPercent) / 100) : 0;
  const saveAmt = Math.floor((rule.amount * rule.savePercent) / 100);
  const spendAmt = rule.amount - goalAmt - saveAmt;
  const legs: { to: string; amount: number; label: string; goalId?: string; kind: "allowance" | "goal_contribution" }[] = [];
  if (spendAmt > 0) legs.push({ to: accts.spending.id, amount: spendAmt, label: "spending", kind: "allowance" });
  if (saveAmt > 0) legs.push({ to: accts.savings.id, amount: saveAmt, label: "savings", kind: "allowance" });
  if (goalAmt > 0 && rule.goalId) {
    const [g] = await db.select().from(goals).where(and(eq(goals.id, rule.goalId), eq(goals.familyId, rule.familyId))).limit(1);
    if (g && g.status === "active") legs.push({ to: g.accountId, amount: goalAmt, label: g.name, goalId: g.id, kind: "goal_contribution" });
    else if (legs[0]) legs[0].amount += goalAmt; // goal gone: fall back to spending
    else legs.push({ to: accts.spending.id, amount: goalAmt, label: "spending", kind: "allowance" });
  }
  if (pool.balance < rule.amount) {
    throw errors.conflict(`The family pool has ${pool.balance} but this allowance needs ${rule.amount}. Top up the pool first.`);
  }
  let duplicate = true;
  await db.transaction(async (tx) => {
    for (const leg of legs) {
      const r = await postTransaction(
        {
          familyId: rule.familyId,
          kind: leg.kind,
          amount: leg.amount,
          currency: pool.currency,
          fromAccountId: pool.id,
          toAccountId: leg.to,
          memberId: rule.memberId,
          goalId: leg.goalId ?? null,
          description: `${rule.cadence === "weekly" ? "Weekly" : "Monthly"} allowance → ${leg.label}`,
          idempotencyKey: `allowance:${rule.id}:${period}:${leg.to}`,
          createdBy: actorUserId,
          metadata: { ruleId: rule.id, period, manual: !!opts.manual },
        },
        tx,
      );
      if (!r.duplicate) duplicate = false;
    }
    await tx
      .update(allowanceRules)
      .set({ lastPaidPeriod: period, nextDueAt: nextDue(rule.cadence, rule.dayOfPeriod, new Date()) })
      .where(eq(allowanceRules.id, rule.id));
  });
  return { duplicate, legs: legs.map((l) => ({ label: l.label, amount: l.amount })) };
}

/** Lazy scheduler: pay any allowances that are due. Called when a parent opens the app. */
export async function processDueAllowances(familyId: string) {
  const due = await db.select().from(allowanceRules).where(and(eq(allowanceRules.familyId, familyId), eq(allowanceRules.active, true), lte(allowanceRules.nextDueAt, new Date())));
  const results: { ruleId: string; ok: boolean; error?: string }[] = [];
  for (const rule of due) {
    const period = periodKey(rule, rule.nextDueAt);
    if (rule.lastPaidPeriod === period) {
      await db.update(allowanceRules).set({ nextDueAt: nextDue(rule.cadence, rule.dayOfPeriod) }).where(eq(allowanceRules.id, rule.id));
      continue;
    }
    try {
      await payAllowance(rule, null, period);
      results.push({ ruleId: rule.id, ok: true });
    } catch (e) {
      results.push({ ruleId: rule.id, ok: false, error: e instanceof Error ? e.message : "failed" });
    }
  }
  return results;
}
