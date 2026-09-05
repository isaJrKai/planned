import { z } from "zod";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { transactions, approvalRequests } from "@/db/schema";
import { handler, ok, parseBody, errors, idempotencyKeyFrom } from "@/lib/api";
import { requireViewer, assertCanActOn, requireFamilyMember } from "@/lib/auth";
import { postTransaction } from "@/lib/ledger";
import { familyPool, memberAccounts, getRules, listTransactions } from "@/lib/family";
import { evaluateAchievements } from "@/lib/achievements";

export const GET = handler(async (req) => {
  const v = await requireViewer();
  const url = new URL(req.url);
  const memberId = v.member.role === "child" ? v.member.id : url.searchParams.get("memberId") ?? undefined;
  return ok(await listTransactions(v.family.id, { memberId, limit: 100 }));
});

const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("deposit"), amount: z.number().int().positive(), note: z.string().trim().max(120).optional() }),
  z.object({ type: z.literal("transfer"), memberId: z.string().uuid(), from: z.enum(["spending", "savings"]), to: z.enum(["spending", "savings"]), amount: z.number().int().positive(), note: z.string().trim().max(120).optional() }),
  z.object({ type: z.literal("spend"), memberId: z.string().uuid(), amount: z.number().int().positive(), description: z.string().trim().min(1, "What was it for?").max(120), category: z.enum(["Food", "Education", "Entertainment", "Transport", "Clothing", "Gifts", "Other"]), needOrWant: z.enum(["need", "want", "unsure"]).optional() }),
  z.object({ type: z.literal("give"), memberId: z.string().uuid(), amount: z.number().int().positive(), to: z.enum(["spending", "savings"]), note: z.string().trim().max(120).optional() }),
]);


export const POST = handler(async (req) => {
  const v = await requireViewer();
  const body = await parseBody(req, schema);
  const key = idempotencyKeyFrom(req);
  const currency = v.family.currency;

  if (body.type === "deposit" || body.type === "give") {
    if (v.member.role !== "parent") throw errors.forbidden("Only parents can add money.");
  }

  if (body.type === "deposit") {
    const pool = await familyPool(v.family.id);
    const r = await postTransaction({ familyId: v.family.id, kind: "deposit", amount: body.amount, currency, toAccountId: pool.id, description: body.note || "Added to family pool", idempotencyKey: key, createdBy: v.user.id });
    return ok(r);
  }

  if (body.type === "give") {
    await requireFamilyMember(v, body.memberId);
    const pool = await familyPool(v.family.id);
    const accts = await memberAccounts(v.family.id, body.memberId);
    const r = await postTransaction({ familyId: v.family.id, kind: "transfer", amount: body.amount, currency, fromAccountId: pool.id, toAccountId: accts[body.to].id, memberId: body.memberId, description: body.note || `Family contribution → ${body.to}`, idempotencyKey: key, createdBy: v.user.id, metadata: { toKind: body.to } });
    return ok(r);
  }

  assertCanActOn(v, body.memberId);
  await requireFamilyMember(v, body.memberId);
  const accts = await memberAccounts(v.family.id, body.memberId);

  if (body.type === "transfer") {
    if (body.from === body.to) throw errors.badRequest("Choose two different accounts.");
    const r = await postTransaction({ familyId: v.family.id, kind: "transfer", amount: body.amount, currency, fromAccountId: accts[body.from].id, toAccountId: accts[body.to].id, memberId: body.memberId, description: body.note || (body.to === "savings" ? "Moved to savings" : "Moved to spending"), idempotencyKey: key, createdBy: v.user.id, metadata: { toKind: body.to, fromKind: body.from } });
    await evaluateAchievements(body.memberId);
    return ok(r);
  }

  // spend — enforce family rules server-side
  const rules = await getRules(v.family.id);
  if (v.member.role === "child") {
    if (rules.approvalThreshold > 0 && body.amount > rules.approvalThreshold) {
      const [reqRow] = await db.insert(approvalRequests).values({ familyId: v.family.id, memberId: body.memberId, type: "purchase", amount: body.amount, reason: `${body.description} (${body.category})` }).returning();
      return ok({ requiresApproval: true, requestId: reqRow.id }, { status: 202 });
    }
    if (rules.dailySpendLimit > 0) {
      const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
      const today = await db.select().from(transactions).where(and(eq(transactions.memberId, body.memberId), eq(transactions.kind, "spend"), eq(transactions.status, "posted"), gte(transactions.createdAt, dayStart)));
      const spent = today.reduce((s, t) => s + t.amount, 0);
      if (spent + body.amount > rules.dailySpendLimit) throw errors.conflict(`That would go past today's spending limit of ${rules.dailySpendLimit.toLocaleString()}.`);
    }
  }
  const r = await postTransaction({ familyId: v.family.id, kind: "spend", amount: body.amount, currency, fromAccountId: accts.spending.id, memberId: body.memberId, description: body.description, category: body.category, idempotencyKey: key, createdBy: v.user.id, metadata: { needOrWant: body.needOrWant ?? null } });
  return ok(r);
});

