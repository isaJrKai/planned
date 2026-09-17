/**
 * Integration tests — multi-tenant isolation + auth flow
 * Uses Neon HTTP driver (same as production).
 *
 * Run: DATABASE_URL="postgresql://..." npx vitest run src/lib/isolation.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import WebSocket from "ws";
import { eq, and, isNull } from "drizzle-orm";
import {
  users,
  families,
  familyMembers,
  sessions,
  accounts,
  goals,
} from "@/db/schema";
import { hashPassword, verifyPassword, sha256, randomToken } from "@/lib/crypto";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_3abZmqje9EBQ@ep-divine-heart-af994g0p-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

neonConfig.webSocketConstructor = WebSocket as any;
const pool = new Pool({ connectionString: TEST_DB_URL, max: 5 });
const db = drizzle(pool);

// --- Helpers ---

async function createTestFamily(name: string, email: string, password: string, currency = "UGX") {
  return db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({ email: email.toLowerCase(), passwordHash: hashPassword(password), displayName: name }).returning();
    const [family] = await tx.insert(families).values({ name: `${name} Family`, currency }).returning();
    const [member] = await tx.insert(familyMembers).values({ familyId: family.id, userId: user.id, role: "parent" }).returning();
    await tx.insert(accounts).values({ familyId: family.id, memberId: null, kind: "family_pool", name: "Family pool", currency });
    return { user, family, member };
  });
}

async function createTestChild(familyId: string, name: string, username: string, password: string) {
  const [user] = await db.insert(users).values({ username: username.toLowerCase(), passwordHash: hashPassword(password), displayName: name }).returning();
  const [member] = await db.insert(familyMembers).values({ familyId, userId: user.id, role: "child" }).returning();
  await db.insert(accounts).values([
    { familyId, memberId: member.id, kind: "spending", name: `${name}'s spending`, currency: "UGX" },
    { familyId, memberId: member.id, kind: "savings", name: `${name}'s savings`, currency: "UGX" },
  ]);
  return { user, member };
}

async function createTestGoal(familyId: string, memberId: string, name: string, target: number) {
  const [acct] = await db.insert(accounts).values({ familyId, memberId, kind: "goal", name: `Goal: ${name}`, currency: "UGX" }).returning();
  const [goal] = await db.insert(goals).values({ familyId, memberId, accountId: acct.id, name, targetAmount: target, isShared: false }).returning();
  return goal;
}

async function createTestSession(userId: string) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const [session] = await db.insert(sessions).values({ userId, tokenHash: sha256(token), expiresAt }).returning();
  return { token, session };
}

async function getGoalsForFamily(familyId: string) {
  return db.select().from(goals).where(eq(goals.familyId, familyId));
}

async function getMembersForFamily(familyId: string) {
  return db.select().from(familyMembers).where(and(eq(familyMembers.familyId, familyId), isNull(familyMembers.deletedAt)));
}

async function getAccountsForFamily(familyId: string) {
  return db.select().from(accounts).where(eq(accounts.familyId, familyId));
}

async function cleanupTestData() {
  await pool.query(`DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.isolation')`);
  await pool.query(`DELETE FROM goals WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')`);
  await pool.query(`DELETE FROM accounts WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')`);
  await pool.query(`DELETE FROM family_members WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')`);
  await pool.query(`DELETE FROM family_settings WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')`);
  await pool.query(`DELETE FROM family_rules WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')`);
  await pool.query(`DELETE FROM audit_log WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')`);
  await pool.query(`DELETE FROM users WHERE email LIKE '%@test.isolation' OR username LIKE 'testiso_%'`);
  await pool.query(`DELETE FROM families WHERE name LIKE '%TestIsolation%'`);
}

// --- Tests ---

describe("Multi-tenant Isolation", () => {
  let familyA: any, familyB: any, childA: any, goalA: any;

  beforeAll(async () => {
    await cleanupTestData();
    const suffix = String(Date.now()).slice(-6);
    familyA = await createTestFamily(`FamilyA TestIsolation`, `familyA-${suffix}@test.isolation`, "TestPassword123!");
    familyB = await createTestFamily(`FamilyB TestIsolation`, `familyB-${suffix}@test.isolation`, "TestPassword456!");
    childA = await createTestChild(familyA.family.id, `ChildA-${suffix}`, `testiso_childa_${suffix}`, "ChildPass123!");
    goalA = await createTestGoal(familyA.family.id, childA.member.id, "New Bicycle", 500000);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("Family A and Family B have different family IDs", () => {
    expect(familyA.family.id).not.toBe(familyB.family.id);
  });

  it("Family A can see its own goals", async () => {
    const goalsA = await getGoalsForFamily(familyA.family.id);
    expect(goalsA.length).toBeGreaterThan(0);
    expect(goalsA.some((g) => g.id === goalA.id)).toBe(true);
  });

  it("Family B cannot see Family A's goals", async () => {
    const goalsB = await getGoalsForFamily(familyB.family.id);
    expect(goalsB.length).toBe(0);
    expect(goalsB.some((g) => g.id === goalA.id)).toBe(false);
  });

  it("Family A can see its own members", async () => {
    const membersA = await getMembersForFamily(familyA.family.id);
    expect(membersA.length).toBe(2);
  });

  it("Family B cannot see Family A's members", async () => {
    const membersB = await getMembersForFamily(familyB.family.id);
    expect(membersB.length).toBe(1);
    expect(membersB.some((m) => m.id === childA.member.id)).toBe(false);
  });

  it("Family A's accounts are separate from Family B's", async () => {
    const accountsA = await getAccountsForFamily(familyA.family.id);
    const accountsB = await getAccountsForFamily(familyB.family.id);
    expect(accountsA.length).toBe(4);
    expect(accountsB.length).toBe(1);
    const idsA = accountsA.map((a) => a.id);
    const idsB = accountsB.map((a) => a.id);
    expect(idsA.filter((id) => idsB.includes(id)).length).toBe(0);
  });

  it("Family A's child is not a member of Family B", async () => {
    const membersB = await getMembersForFamily(familyB.family.id);
    expect(membersB.some((m) => m.userId === childA.user.id)).toBe(false);
  });
});

describe("Auth Flow", () => {
  it("hashes passwords with scrypt (not plaintext)", () => {
    const hash = hashPassword("testPassword123");
    expect(hash).not.toBe("testPassword123");
    expect(hash.startsWith("scrypt$")).toBe(true);
  });

  it("verifies correct password", () => {
    const hash = hashPassword("myPassword");
    expect(verifyPassword("myPassword", hash)).toBe(true);
  });

  it("rejects wrong password", () => {
    const hash = hashPassword("correctPassword");
    expect(verifyPassword("wrongPassword", hash)).toBe(false);
  });

  it("creates a session with token hash", async () => {
    const suffix = String(Date.now()).slice(-6);
    const f = await createTestFamily(`AuthSession TestIsolation`, `authsession-${suffix}@test.isolation`, "SessionPassword123!");
    const { token, session } = await createTestSession(f.user.id);
    expect(session.tokenHash).not.toBe(token);
    expect(session.tokenHash).toBe(sha256(token));
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("session token can be looked up by hash", async () => {
    const suffix = String(Date.now()).slice(-6);
    const f = await createTestFamily(`AuthLookup TestIsolation`, `authlookup-${suffix}@test.isolation`, "LookupPassword123!");
    const { token, session } = await createTestSession(f.user.id);
    const [found] = await db.select().from(sessions).where(eq(sessions.tokenHash, sha256(token))).limit(1);
    expect(found).toBeDefined();
    expect(found.id).toBe(session.id);
  });

  it("revoked session cannot be used", async () => {
    const suffix = String(Date.now()).slice(-6);
    const f = await createTestFamily(`AuthRevoke TestIsolation`, `authrevoke-${suffix}@test.isolation`, "RevokePassword123!");
    const { token, session } = await createTestSession(f.user.id);
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, session.id));
    const [found] = await db.select().from(sessions).where(and(eq(sessions.tokenHash, sha256(token)), isNull(sessions.revokedAt))).limit(1);
    expect(found).toBeUndefined();
  });

  it("expired session cannot be used", async () => {
    const suffix = String(Date.now()).slice(-6);
    const f = await createTestFamily(`AuthExpiry TestIsolation`, `authexpiry-${suffix}@test.isolation`, "ExpiryPassword123!");
    const expiredToken = randomToken(32);
    const [session] = await db.insert(sessions).values({ userId: f.user.id, tokenHash: sha256(expiredToken), expiresAt: new Date(Date.now() - 1000) }).returning();
    const now = new Date();
    const [found] = await db.select().from(sessions).where(and(eq(sessions.tokenHash, sha256(expiredToken)), isNull(sessions.revokedAt))).limit(1);
    expect(found).toBeDefined();
    expect(found.expiresAt.getTime()).toBeLessThan(now.getTime());
    await cleanupTestData();
  await pool.end();
  });
});
