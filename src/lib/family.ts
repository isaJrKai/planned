import { and, eq, isNull, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users, families, familyMembers, accounts, familyRules, familySettings, goals, transactions, allowanceRules, approvalRequests } from "@/db/schema";
import { hashPassword } from "./crypto";
import { errors } from "./api";
import { audit } from "./audit";

export async function createFamilyWithParent(input: { familyName: string; currency: string; parentName: string; email: string; password: string }) {
  return db.transaction(async (tx) => {
    const email = input.email.toLowerCase().trim();
    const dupe = await tx.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (dupe[0]) throw errors.conflict("An account with that email already exists.");
    const [user] = await tx.insert(users).values({ email, passwordHash: hashPassword(input.password), displayName: input.parentName.trim() }).returning();
    const [family] = await tx.insert(families).values({ name: input.familyName.trim(), currency: input.currency }).returning();
    const [member] = await tx.insert(familyMembers).values({ familyId: family.id, userId: user.id, role: "parent" }).returning();
    await tx.insert(accounts).values({ familyId: family.id, memberId: null, kind: "family_pool", name: "Family pool", currency: family.currency });
    await tx.insert(familyRules).values({ familyId: family.id, minSavePercent: 20, approvalThreshold: 0, dailySpendLimit: 0 });
    await tx.insert(familySettings).values({ familyId: family.id });
    await audit({ familyId: family.id, actorUserId: user.id, action: "family.created", targetType: "family", targetId: family.id, details: { name: family.name, currency: family.currency } }, null, tx);
    return { user, family, member };
  });
}

export async function addChild(familyId: string, actorUserId: string, input: { name: string; username: string; password: string; birthYear?: number }) {
  return db.transaction(async (tx) => {
    const username = input.username.toLowerCase().trim();
    const dupe = await tx.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (dupe[0]) throw errors.conflict("That username is taken. Try another.");
    const [fam] = await tx.select().from(families).where(eq(families.id, familyId)).limit(1);
    if (!fam) throw errors.notFound("Family");
    const [user] = await tx.insert(users).values({ username, passwordHash: hashPassword(input.password), displayName: input.name.trim() }).returning();
    const [member] = await tx.insert(familyMembers).values({ familyId, userId: user.id, role: "child", birthYear: input.birthYear ?? null }).returning();
    await tx.insert(accounts).values([
      { familyId, memberId: member.id, kind: "spending", name: `${user.displayName}'s spending`, currency: fam.currency },
      { familyId, memberId: member.id, kind: "savings", name: `${user.displayName}'s savings`, currency: fam.currency },
    ]);
    await audit({ familyId, actorUserId, action: "child.created", targetType: "member", targetId: member.id, details: { name: user.displayName, username } }, null, tx);
    return { user, member };
  });
}

export async function listMembers(familyId: string) {
  return db
    .select({ member: familyMembers, user: users })
    .from(familyMembers)
    .innerJoin(users, eq(users.id, familyMembers.userId))
    .where(and(eq(familyMembers.familyId, familyId), isNull(familyMembers.deletedAt)))
    .orderBy(familyMembers.role, familyMembers.createdAt);
}

export async function listAccounts(familyId: string) {
  return db.select().from(accounts).where(and(eq(accounts.familyId, familyId), isNull(accounts.closedAt)));
}

export async function memberAccounts(familyId: string, memberId: string) {
  const rows = await db.select().from(accounts).where(and(eq(accounts.familyId, familyId), eq(accounts.memberId, memberId), isNull(accounts.closedAt)));
  const spending = rows.find((a) => a.kind === "spending");
  const savings = rows.find((a) => a.kind === "savings");
  if (!spending || !savings) throw errors.notFound("That member's accounts");
  return { spending, savings, goalAccounts: rows.filter((a) => a.kind === "goal") };
}

export async function familyPool(familyId: string) {
  const [a] = await db.select().from(accounts).where(and(eq(accounts.familyId, familyId), eq(accounts.kind, "family_pool"))).limit(1);
  if (!a) throw errors.notFound("Family pool");
  return a;
}

export async function getRules(familyId: string) {
  const [r] = await db.select().from(familyRules).where(eq(familyRules.familyId, familyId)).limit(1);
  return r ?? { familyId, minSavePercent: 0, approvalThreshold: 0, dailySpendLimit: 0, goalWithdrawalNeedsApproval: true, updatedAt: new Date() };
}

export async function listGoals(familyId: string, memberId?: string) {
  const where = memberId ? and(eq(goals.familyId, familyId), eq(goals.memberId, memberId)) : eq(goals.familyId, familyId);
  const rows = await db.select({ goal: goals, account: accounts }).from(goals).innerJoin(accounts, eq(accounts.id, goals.accountId)).where(where).orderBy(desc(goals.createdAt));
  return rows.map((r) => ({ ...r.goal, saved: r.account.balance }));
}

export async function listTransactions(familyId: string, opts: { memberId?: string; limit?: number; accountIds?: string[] } = {}) {
  const conds = [eq(transactions.familyId, familyId)];
  if (opts.memberId) conds.push(eq(transactions.memberId, opts.memberId));
  const rows = await db.select().from(transactions).where(and(...conds)).orderBy(desc(transactions.createdAt)).limit(opts.limit ?? 50);
  if (opts.accountIds && opts.accountIds.length) {
    const set = new Set(opts.accountIds);
    return rows.filter((t) => (t.fromAccountId && set.has(t.fromAccountId)) || (t.toAccountId && set.has(t.toAccountId)));
  }
  return rows;
}

export async function listAllowanceRules(familyId: string, memberId?: string) {
  const where = memberId ? and(eq(allowanceRules.familyId, familyId), eq(allowanceRules.memberId, memberId)) : eq(allowanceRules.familyId, familyId);
  return db.select().from(allowanceRules).where(where).orderBy(desc(allowanceRules.createdAt));
}

export async function listPendingApprovals(familyId: string) {
  return db.select().from(approvalRequests).where(and(eq(approvalRequests.familyId, familyId), eq(approvalRequests.status, "pending"))).orderBy(desc(approvalRequests.createdAt));
}

export async function accountNameMap(familyId: string) {
  const rows = await listAccounts(familyId);
  const m: Record<string, { name: string; kind: string; memberId: string | null }> = {};
  for (const a of rows) m[a.id] = { name: a.name, kind: a.kind, memberId: a.memberId };
  return m;
}

export async function membersByIds(ids: string[]) {
  if (!ids.length) return {};
  const rows = await db.select({ member: familyMembers, user: users }).from(familyMembers).innerJoin(users, eq(users.id, familyMembers.userId)).where(inArray(familyMembers.id, ids));
  const m: Record<string, string> = {};
  for (const r of rows) m[r.member.id] = r.user.displayName;
  return m;
}
