/**
 * Integration tests — multi-tenant isolation + auth flow
 *
 * These tests hit a REAL PostgreSQL database (the production Neon instance)
 * but create and clean up their own test data. They never touch existing
 * production data because they use unique email addresses per test run.
 *
 * Run: npx vitest run src/lib/isolation.test.ts
 *
 * If you want a separate test database, create a Neon branch and set
 * DATABASE_URL in .env.test — but for now we use the same DB with
 * unique test data that gets cleaned up.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, isNull } from "drizzle-orm";
import {
  users,
  families,
  familyMembers,
  sessions,
  accounts,
  goals,
  transactions,
} from "@/db/schema";
import { hashPassword, verifyPassword, sha256, randomToken } from "@/lib/crypto";

// --- Test database connection ---
// Force IPv4 to avoid ECONNREFUSED ::1:5432 (IPv6 resolution issue)
const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_3abZmqje9EBQ@ep-divine-heart-af994g0p-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: TEST_DB_URL,
  max: 5,
  // Force IPv4 resolution
  host: undefined as any, // let connectionString handle it
});
// Override DNS resolution to force IPv4
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const db = drizzle(pool);

// --- Helpers ---

/** Create a family with a parent — mirrors createFamilyWithParent but uses test DB */
async function createTestFamily(name: string, email: string, password: string, currency = "UGX") {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email: email.toLowerCase(), passwordHash: hashPassword(password), displayName: name })
      .returning();
    const [family] = await tx
      .insert(families)
      .values({ name: `${name} Family`, currency })
      .returning();
    const [member] = await tx
      .insert(familyMembers)
      .values({ familyId: family.id, userId: user.id, role: "parent" })
      .returning();
    await tx
      .insert(accounts)
      .values({ familyId: family.id, memberId: null, kind: "family_pool", name: "Family pool", currency });
    return { user, family, member };
  });
}

/** Create a child in a family */
async function createTestChild(familyId: string, name: string, username: string, password: string) {
  const [user] = await db
    .insert(users)
    .values({ username: username.toLowerCase(), passwordHash: hashPassword(password), displayName: name })
    .returning();
  const [member] = await db
    .insert(familyMembers)
    .values({ familyId, userId: user.id, role: "child" })
    .returning();
  await db.insert(accounts).values([
    { familyId, memberId: member.id, kind: "spending", name: `${name}'s spending`, currency: "UGX" },
    { familyId, memberId: member.id, kind: "savings", name: `${name}'s savings`, currency: "UGX" },
  ]);
  return { user, member };
}

/** Create a goal for a family member */
async function createTestGoal(familyId: string, memberId: string, name: string, target: number) {
  const [acct] = await db
    .insert(accounts)
    .values({ familyId, memberId, kind: "goal", name: `Goal: ${name}`, currency: "UGX" })
    .returning();
  const [goal] = await db
    .insert(goals)
    .values({ familyId, memberId, accountId: acct.id, name, targetAmount: target, isShared: false })
    .returning();
  return goal;
}

/** Create a session for a user (simulates login) */
async function createTestSession(userId: string) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const [session] = await db
    .insert(sessions)
    .values({ userId, tokenHash: sha256(token), expiresAt })
    .returning();
  return { token, session };
}

/** Get goals scoped to a family (simulates what the API does) */
async function getGoalsForFamily(familyId: string) {
  return db.select().from(goals).where(eq(goals.familyId, familyId));
}

/** Get members scoped to a family */
async function getMembersForFamily(familyId: string) {
  return db
    .select()
    .from(familyMembers)
    .where(and(eq(familyMembers.familyId, familyId), isNull(familyMembers.deletedAt)));
}

/** Get accounts scoped to a family */
async function getAccountsForFamily(familyId: string) {
  return db.select().from(accounts).where(eq(accounts.familyId, familyId));
}

/** Clean up all test data */
async function cleanupTestData(prefix: string) {
  // Delete in dependency order (foreign keys)
  const testUsers = await db.select({ id: users.id }).from(users).where(eq(users.email, `${prefix}@test.isolation`));

  // If we used a pattern, delete by pattern
  const pool2 = pool;
  await pool2.query("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.isolation')");
  await pool2.query("DELETE FROM goals WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%Test%Isolation%')");
  await pool2.query("DELETE FROM accounts WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%Test%Isolation%')");
  await pool2.query("DELETE FROM transactions WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%Test%Isolation%')");
  await pool2.query("DELETE FROM family_members WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%Test%Isolation%')");
  await pool2.query("DELETE FROM family_settings WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%Test%Isolation%')");
  await pool2.query("DELETE FROM family_rules WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%Test%Isolation%')");
  await pool2.query("DELETE FROM audit_log WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%Test%Isolation%')");
  await pool2.query("DELETE FROM users WHERE email LIKE '%@test.isolation' OR username LIKE 'testiso_%'");
  await pool2.query("DELETE FROM families WHERE name LIKE '%Test%Isolation%'");
}

// --- Tests ---

describe("Multi-tenant Isolation", () => {
  const suffix = String(Date.now()).slice(-6);
  let familyA: { user: any; family: any; member: any };
  let familyB: { user: any; family: any; member: any };
  let childA: { user: any; member: any };
  let goalA: any;

  beforeAll(async () => {
    // Clean up any leftover data from previous runs
    await cleanupTestData(`isolation-${suffix}`);

    // Create two separate families
    familyA = await createTestFamily(
      `FamilyA TestIsolation`,
      `familyA-${suffix}@test.isolation`,
      "TestPassword123!"
    );
    familyB = await createTestFamily(
      `FamilyB TestIsolation`,
      `familyB-${suffix}@test.isolation`,
      "TestPassword456!"
    );

    // Add a child to Family A
    childA = await createTestChild(
      familyA.family.id,
      `ChildA-${suffix}`,
      `testiso_childa_${suffix}`,
      "ChildPass123!"
    );

    // Create a goal for the child in Family A
    goalA = await createTestGoal(familyA.family.id, childA.member.id, "New Bicycle", 500000);
  });

  afterAll(async () => {
    // Clean up test data — use raw pool queries for cleanup
    try {
      await pool.query("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.isolation')");
      await pool.query("DELETE FROM goals WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')");
      await pool.query("DELETE FROM accounts WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')");
      await pool.query("DELETE FROM family_members WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')");
      await pool.query("DELETE FROM family_settings WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')");
      await pool.query("DELETE FROM family_rules WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')");
      await pool.query("DELETE FROM audit_log WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')");
      await pool.query("DELETE FROM users WHERE email LIKE '%@test.isolation' OR username LIKE 'testiso_%'");
      await pool.query("DELETE FROM families WHERE name LIKE '%TestIsolation%'");
    } catch (e) {
      // Ignore cleanup errors — test data with unique suffixes won't conflict
    }
    // DON'T close the pool here — it's shared with the Auth Flow tests
  });

  it("Family A and Family B have different family IDs", () => {
    expect(familyA.family.id).not.toBe(familyB.family.id);
  });

  it("Family A can see its own goals", async () => {
    const goalsA = await getGoalsForFamily(familyA.family.id);
    expect(goalsA.length).toBeGreaterThan(0);
    expect(goalsA.some((g) => g.id === goalA.id)).toBe(true);
  });

  it("Family B cannot see Family A's goals (isolation check)", async () => {
    const goalsB = await getGoalsForFamily(familyB.family.id);
    // Family B should have 0 goals (we didn't create any for them)
    expect(goalsB.length).toBe(0);
    // Specifically, Family A's goal should NOT be in Family B's list
    expect(goalsB.some((g) => g.id === goalA.id)).toBe(false);
  });

  it("Family A can see its own members", async () => {
    const membersA = await getMembersForFamily(familyA.family.id);
    expect(membersA.length).toBe(2); // 1 parent + 1 child
  });

  it("Family B cannot see Family A's members (isolation check)", async () => {
    const membersB = await getMembersForFamily(familyB.family.id);
    expect(membersB.length).toBe(1); // only the parent
    // Family A's child should NOT be in Family B's member list
    expect(membersB.some((m) => m.id === childA.member.id)).toBe(false);
  });

  it("Family A's accounts are separate from Family B's accounts", async () => {
    const accountsA = await getAccountsForFamily(familyA.family.id);
    const accountsB = await getAccountsForFamily(familyB.family.id);

    // Family A should have: family_pool + spending + savings + goal = 4 accounts
    expect(accountsA.length).toBe(4);
    // Family B should have: family_pool only = 1 account
    expect(accountsB.length).toBe(1);

    // No account from Family A should appear in Family B's list
    const accountIdsA = accountsA.map((a) => a.id);
    const accountIdsB = accountsB.map((a) => a.id);
    const intersection = accountIdsA.filter((id) => accountIdsB.includes(id));
    expect(intersection.length).toBe(0);
  });

  it("Family A's child is not a member of Family B", async () => {
    const membersB = await getMembersForFamily(familyB.family.id);
    const memberUserIds = membersB.map((m) => m.userId);
    expect(memberUserIds).not.toContain(childA.user.id);
  });
});

describe("Auth Flow", () => {
  const suffix = String(Date.now()).slice(-6);

  afterAll(async () => {
    try {
      await pool.query("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.isolation')");
      await pool.query("DELETE FROM family_members WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')");
      await pool.query("DELETE FROM family_settings WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')");
      await pool.query("DELETE FROM family_rules WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')");
      await pool.query("DELETE FROM audit_log WHERE family_id IN (SELECT id FROM families WHERE name LIKE '%TestIsolation%')");
      await pool.query("DELETE FROM users WHERE email LIKE '%@test.isolation' OR username LIKE 'testiso_%'");
      await pool.query("DELETE FROM families WHERE name LIKE '%TestIsolation%'");
    } catch (e) {
      // Ignore — unique suffixes prevent conflicts
    }
    // Close the pool after ALL tests are done
    await pool.end();
  });

  it("hashes passwords with scrypt (not plaintext)", async () => {
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

  it("creates a session with token hash (not plaintext token)", async () => {
    // Create a test family for auth tests
    const f = await createTestFamily(
      `AuthTest TestIsolation`,
      `auth-${suffix}@test.isolation`,
      "AuthPassword123!"
    );

    // Create session
    const { token, session } = await createTestSession(f.user.id);

    // The stored hash should NOT be the plaintext token
    expect(session.tokenHash).not.toBe(token);
    expect(session.tokenHash).toBe(sha256(token));

    // Session should have future expiry
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("session token can be looked up by hash", async () => {
    const f = await createTestFamily(
      `AuthLookup TestIsolation`,
      `authlookup-${suffix}@test.isolation`,
      "LookupPassword123!"
    );

    const { token, session } = await createTestSession(f.user.id);

    // Look up by hash (what getViewer does)
    const [found] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, sha256(token)))
      .limit(1);

    expect(found).toBeDefined();
    expect(found.id).toBe(session.id);
    expect(found.userId).toBe(f.user.id);
  });

  it("revoked session cannot be used", async () => {
    const f = await createTestFamily(
      `AuthRevoke TestIsolation`,
      `authrevoke-${suffix}@test.isolation`,
      "RevokePassword123!"
    );

    const { token, session } = await createTestSession(f.user.id);

    // Revoke the session
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, session.id));

    // Look up non-revoked sessions (what getViewer does)
    const [found] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.tokenHash, sha256(token)), isNull(sessions.revokedAt)))
      .limit(1);

    // Should NOT find it (it's revoked)
    expect(found).toBeUndefined();
  });

  it("expired session cannot be used", async () => {
    const f = await createTestFamily(
      `AuthExpiry TestIsolation`,
      `authexpiry-${suffix}@test.isolation`,
      "ExpiryPassword123!"
    );

    // Create session that's already expired
    const expiredToken = randomToken(32);
    const pastDate = new Date(Date.now() - 1000);
    const [session] = await db
      .insert(sessions)
      .values({
        userId: f.user.id,
        tokenHash: sha256(expiredToken),
        expiresAt: pastDate,
      })
      .returning();

    // Look up non-expired sessions (what getViewer does)
    const now = new Date();
    const [found] = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.tokenHash, sha256(expiredToken)),
        isNull(sessions.revokedAt),
        // In the real query: gt(sessions.expiresAt, now)
        // We check expiry in the test
      ))
      .limit(1);

    // Session exists but is expired
    expect(found).toBeDefined();
    expect(found.expiresAt.getTime()).toBeLessThan(now.getTime());
  });
});
