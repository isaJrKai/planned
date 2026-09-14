/**
 * Seed demo data — creates a demo family with parent, child, goals, and transactions.
 * Usage: DATABASE_URL="postgresql://..." node scripts/seed.js
 * Safe to run multiple times — uses unique email per run.
 */
const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const { eq } = require("drizzle-orm");

// We need to import schema — use dynamic require for CommonJS compatibility
const schema = require("../src/db/schema");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL || DATABASE_URL.startsWith("file:")) {
  console.error("ERROR: Set DATABASE_URL to a PostgreSQL connection string");
  process.exit(1);
}

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const pool = new Pool({ connectionString: DATABASE_URL, max: 5 });
const db = drizzle(pool);

const crypto = require("crypto");
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function seed() {
  const suffix = String(Date.now()).slice(-6);
  console.log("=== Seeding demo family ===\n");

  // 1. Create parent user
  const [parent] = await db.insert(schema.users).values({
    email: `demo-${suffix}@planned.app`,
    passwordHash: hashPassword("Demo123456!"),
    displayName: "Sarah Demo",
  }).returning();
  console.log(`  ✓ Parent: ${parent.email} (password: Demo123456!)`);

  // 2. Create family
  const [family] = await db.insert(schema.families).values({
    name: "The Demo Family",
    currency: "UGX",
  }).returning();
  console.log(`  ✓ Family: ${family.name}`);

  // 3. Link parent to family
  const [parentMember] = await db.insert(schema.familyMembers).values({
    familyId: family.id,
    userId: parent.id,
    role: "parent",
  }).returning();
  console.log(`  ✓ Parent member linked`);

  // 4. Create family pool account
  const [poolAcct] = await db.insert(schema.accounts).values({
    familyId: family.id,
    memberId: null,
    kind: "family_pool",
    name: "Family pool",
    currency: "UGX",
    balance: 500000,
  }).returning();
  console.log(`  ✓ Family pool: UGX 500,000`);

  // 5. Create family rules + settings
  await db.insert(schema.familyRules).values({ familyId: family.id, minSavePercent: 20, approvalThreshold: 50000, dailySpendLimit: 20000 });
  await db.insert(schema.familySettings).values({ familyId: family.id });
  console.log(`  ✓ Family rules + settings created`);

  // 6. Create child user
  const [child] = await db.insert(schema.users).values({
    username: `demo_emma_${suffix}`,
    passwordHash: hashPassword("emma1234"),
    displayName: "Emma",
  }).returning();
  console.log(`  ✓ Child: ${child.username} (password: emma1234)`);

  // 7. Link child to family
  const [childMember] = await db.insert(schema.familyMembers).values({
    familyId: family.id,
    userId: child.id,
    role: "child",
    birthYear: 2015,
  }).returning();
  console.log(`  ✓ Child member linked`);

  // 8. Create child accounts (spending + savings)
  const [spendingAcct] = await db.insert(schema.accounts).values({
    familyId: family.id,
    memberId: childMember.id,
    kind: "spending",
    name: "Emma's spending",
    currency: "UGX",
    balance: 25000,
  }).returning();
  const [savingsAcct] = await db.insert(schema.accounts).values({
    familyId: family.id,
    memberId: childMember.id,
    kind: "savings",
    name: "Emma's savings",
    currency: "UGX",
    balance: 150000,
  }).returning();
  console.log(`  ✓ Emma spending: UGX 25,000`);
  console.log(`  ✓ Emma savings: UGX 150,000`);

  // 9. Create a goal
  const [goalAcct] = await db.insert(schema.accounts).values({
    familyId: family.id,
    memberId: childMember.id,
    kind: "goal",
    name: "Goal: New Bicycle",
    currency: "UGX",
    balance: 85000,
  }).returning();
  const [goal] = await db.insert(schema.goals).values({
    familyId: family.id,
    memberId: childMember.id,
    accountId: goalAcct.id,
    name: "New Bicycle",
    targetAmount: 300000,
    isShared: false,
  }).returning();
  console.log(`  ✓ Goal: ${goal.name} (UGX 85,000 / 300,000 = 28%)`);

  // 10. Create some transactions
  const now = Date.now();
  const txns = [
    { kind: "deposit", amount: 500000, note: "Monthly deposit to family pool", ago: 14 },
    { kind: "allowance", amount: 30000, note: "Emma's weekly allowance", ago: 7 },
    { kind: "goal_contribution", amount: 25000, note: "Emma saved toward bicycle", ago: 5 },
    { kind: "spend", amount: 5000, note: "Snacks after school", ago: 3 },
    { kind: "goal_contribution", amount: 10000, note: "Saved from birthday money", ago: 2 },
    { kind: "spend", amount: 8000, note: "Art supplies", ago: 1 },
  ];

  for (const t of txns) {
    await db.insert(schema.transactions).values({ idempotencyKey: `seed-${suffix}-${t.ago}`,
      familyId: family.id,
      kind: t.kind,
      amount: t.amount,
      currency: "UGX",
      status: "posted",
      description: t.note,
      createdAt: new Date(now - t.ago * 86400000),
      createdBy: parent.id,
    });
  }
  console.log(`  ✓ ${txns.length} transactions created`);

  // 11. Audit log entry
  await db.insert(schema.auditLog).values({
    familyId: family.id,
    actorUserId: parent.id,
    action: "seed.demo_family",
    targetType: "family",
    targetId: family.id,
  });

  console.log("\n=== Seed complete ===");
  console.log(`\nDemo credentials:`);
  console.log(`  Parent: ${parent.email} / Demo123456!`);
  console.log(`  Child username: ${child.username} / emma1234`);
  console.log(`\nGo to https://planned-family.vercel.app/login to try it.`);

  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
