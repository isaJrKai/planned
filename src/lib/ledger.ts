import { and, eq, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions, goals, type Transaction } from "@/db/schema";
import { errors } from "./api";
import { audit } from "./audit";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type PostInput = {
  familyId: string;
  kind: Transaction["kind"];
  amount: number;
  currency: string;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  memberId?: string | null;
  goalId?: string | null;
  category?: string | null;
  description: string;
  idempotencyKey: string;
  createdBy?: string | null;
  metadata?: Record<string, unknown>;
  reversesId?: string | null;
};

export type PostResult = { transaction: Transaction; duplicate: boolean };

function assertAmount(amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw errors.badRequest("Amount must be a positive whole number of minor units.");
  }
}

/**
 * Post a ledger entry atomically.
 *  1. Idempotency: same (familyId, key) returns the original row.
 *  2. Locks the involved account rows (FOR UPDATE, deterministic order) to avoid races.
 *  3. Verifies ownership: every account must belong to the family.
 *  4. Verifies funds on the source account.
 *  5. Inserts the transaction and applies balance deltas in one DB transaction.
 */
export async function postTransaction(input: PostInput, outerTx?: Tx): Promise<PostResult> {
  assertAmount(input.amount);
  if (!input.fromAccountId && !input.toAccountId) throw errors.badRequest("A transaction needs a source or a destination.");

  const run = async (tx: Tx): Promise<PostResult> => {
    const existing = await tx
      .select()
      .from(transactions)
      .where(and(eq(transactions.familyId, input.familyId), eq(transactions.idempotencyKey, input.idempotencyKey)))
      .limit(1);
    if (existing[0]) return { transaction: existing[0], duplicate: true };

    const ids = [input.fromAccountId, input.toAccountId].filter((x): x is string => !!x).sort();
    const locked = await tx
      .select()
      .from(accounts)
      .where(and(inArray(accounts.id, ids), eq(accounts.familyId, input.familyId)))
      .for("update");
    if (locked.length !== new Set(ids).size) throw errors.notFound("One of those accounts");
    for (const a of locked) {
      if (a.closedAt) throw errors.conflict(`${a.name} is closed.`);
      if (a.currency !== input.currency) throw errors.badRequest("Currency mismatch.");
    }
    const from = locked.find((a) => a.id === input.fromAccountId);
    if (from && from.balance < input.amount) {
      throw errors.conflict(`Not enough in ${from.name}. Available: ${from.balance}.`);
    }

    let inserted: Transaction;
    try {
      [inserted] = await tx
        .insert(transactions)
        .values({
          familyId: input.familyId,
          kind: input.kind,
          amount: input.amount,
          currency: input.currency,
          fromAccountId: input.fromAccountId ?? null,
          toAccountId: input.toAccountId ?? null,
          memberId: input.memberId ?? null,
          goalId: input.goalId ?? null,
          category: input.category ?? null,
          description: input.description,
          idempotencyKey: input.idempotencyKey,
          createdBy: input.createdBy ?? null,
          metadata: input.metadata,
          reversesId: input.reversesId ?? null,
        })
        .returning();
    } catch (e: unknown) {
      // Unique violation under concurrency: return the winner.
      if (typeof e === "object" && e && "code" in e && (e as { code?: string }).code === "23505") {
        const again = await tx
          .select()
          .from(transactions)
          .where(and(eq(transactions.familyId, input.familyId), eq(transactions.idempotencyKey, input.idempotencyKey)))
          .limit(1);
        if (again[0]) return { transaction: again[0], duplicate: true };
      }
      throw e;
    }

    if (input.fromAccountId) {
      await tx.update(accounts).set({ balance: sql`${accounts.balance} - ${input.amount}` }).where(eq(accounts.id, input.fromAccountId));
    }
    if (input.toAccountId) {
      await tx.update(accounts).set({ balance: sql`${accounts.balance} + ${input.amount}` }).where(eq(accounts.id, input.toAccountId));
    }

    // Goal completion is a deterministic side effect of the ledger.
    if (input.goalId) {
      const [g] = await tx.select().from(goals).where(eq(goals.id, input.goalId)).limit(1);
      if (g && g.status === "active") {
        const [acct] = await tx.select().from(accounts).where(eq(accounts.id, g.accountId)).limit(1);
        if (acct && acct.balance >= g.targetAmount) {
          await tx.update(goals).set({ status: "completed", completedAt: new Date() }).where(eq(goals.id, g.id));
        }
      }
    }

    await audit(
      {
        familyId: input.familyId,
        actorUserId: input.createdBy ?? null,
        action: `transaction.${input.kind}`,
        targetType: "transaction",
        targetId: inserted.id,
        details: { amount: input.amount, currency: input.currency, from: input.fromAccountId, to: input.toAccountId, description: input.description },
      },
      null,
      tx,
    );
    return { transaction: inserted, duplicate: false };
  };

  return outerTx ? run(outerTx) : db.transaction(run);
}

/** Reverse a posted transaction by posting an equal and opposite entry. */
export async function reverseTransaction(familyId: string, txnId: string, actorUserId: string, reason: string) {
  return db.transaction(async (tx) => {
    const [orig] = await tx.select().from(transactions).where(and(eq(transactions.id, txnId), eq(transactions.familyId, familyId))).for("update");
    if (!orig) throw errors.notFound("That transaction");
    if (orig.status === "reversed") throw errors.conflict("This transaction was already reversed.");
    if (orig.kind === "reversal") throw errors.conflict("A reversal cannot be reversed.");
    const res = await postTransaction(
      {
        familyId,
        kind: "reversal",
        amount: orig.amount,
        currency: orig.currency,
        fromAccountId: orig.toAccountId,
        toAccountId: orig.fromAccountId,
        memberId: orig.memberId,
        goalId: orig.goalId,
        description: `Reversal: ${orig.description}`,
        idempotencyKey: `reverse:${orig.id}`,
        createdBy: actorUserId,
        metadata: { reason },
        reversesId: orig.id,
      },
      tx,
    );
    await tx.update(transactions).set({ status: "reversed" }).where(eq(transactions.id, orig.id));
    return res.transaction;
  });
}

/** Compare cached balances against the ledger. Returns discrepancies. */
export async function reconcileFamily(familyId: string) {
  const rows = await db.execute(sql`
    select a.id, a.name, a.balance as cached,
      coalesce((select sum(t.amount) from transactions t where t.to_account_id = a.id),0)
      - coalesce((select sum(t.amount) from transactions t where t.from_account_id = a.id),0) as derived
    from accounts a where a.family_id = ${familyId}
  `);
  const list = (rows.rows as { id: string; name: string; cached: string; derived: string }[]).map((r) => ({
    accountId: r.id,
    name: r.name,
    cached: Number(r.cached),
    derived: Number(r.derived),
  }));
  return { accounts: list, issues: list.filter((r) => r.cached !== r.derived) };
}
