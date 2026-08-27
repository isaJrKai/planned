// ============================================================================
// scripts/seed-founder.js — Seed a real founder account + SystemSettings row
// ============================================================================
// This script is idempotent. It creates a working founder account so the
// login flow actually functions. Use it after a fresh `prisma db push`.
// ============================================================================

/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const FOUNUNDER_EMAIL = (process.env.FOUNDER_EMAIL || "founder@planned.app").trim().toLowerCase();
const FOUNDER_PASSWORD = process.env.FOUNDER_PASSWORD || "PlannedFound3r!2026";
const FOUNDER_NAME = process.env.FOUNDER_NAME || "Founder";
const SECURITY_QUESTION = "What is the name of your first pet?";
const SECURITY_ANSWER = "tobias";

const BCRYPT_COST = 12;

async function main() {
  const db = new PrismaClient();
  try {
    console.log("");
    console.log("=".repeat(72));
    console.log("  PLANNED — SEED FOUNDER ACCOUNT");
    console.log("=".repeat(72));
    console.log("");
    console.log("  Email:           " + FOUNUNDER_EMAIL);
    console.log("  Password:        " + FOUNDER_PASSWORD);
    console.log("  Name:            " + FOUNDER_NAME);
    console.log("  Security Q:      " + SECURITY_QUESTION);
    console.log("  Security A:      " + SECURITY_ANSWER);
    console.log("");

    // Step 1: check if SystemSettings already initialized
    const existingSettings = await db.systemSettings.findUnique({ where: { id: "singleton" } });
    if (existingSettings?.isInitialized) {
      console.log("  ⚠ System already initialized. Checking for existing founder...");
      const existing = await db.user.findFirst({ where: { platformRole: "FOUNDER", deletedAt: null } });
      if (existing) {
        console.log("  ✓ Founder already exists: " + existing.email);
        console.log("  → If you forgot the password, delete db/custom.db and re-run.");
        return;
      }
    }

    // Step 2: hash password + security answer
    console.log("Step 1: Hashing password (bcrypt cost " + BCRYPT_COST + ")...");
    const passwordHash = await bcrypt.hash(FOUNDER_PASSWORD, BCRYPT_COST);
    const securityAnswerHash = await bcrypt.hash(SECURITY_ANSWER.trim().toLowerCase().replace(/\s+/g, " "), BCRYPT_COST);

    // Step 3: create founder + SystemSettings in a transaction
    console.log("Step 2: Creating founder user + SystemSettings...");
    const result = await db.$transaction(async (tx) => {
      // Delete any pre-existing founder with the same email (soft-deleted or otherwise)
      await tx.user.deleteMany({ where: { email: FOUNUNDER_EMAIL } });

      const founder = await tx.user.create({
        data: {
          email: FOUNUNDER_EMAIL,
          name: FOUNDER_NAME,
          passwordHash,
          platformRole: "FOUNDER",
          familyRole: "FAMILY_MANAGER",
          securityQuestion: SECURITY_QUESTION,
          securityAnswerHash,
          emailVerified: new Date(),
          lastLoginAt: null,
          twoFactorEnabled: false,
          failedLoginAttempts: 0,
        },
      });

      await tx.systemSettings.upsert({
        where: { id: "singleton" },
        update: {
          isInitialized: true,
          superAdminUserId: founder.id,
          superAdminEmail: founder.email,
          setupCompletedAt: new Date(),
        },
        create: {
          id: "singleton",
          isInitialized: true,
          superAdminUserId: founder.id,
          superAdminEmail: founder.email,
          setupCompletedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: founder.id,
          action: "FOUNDER_SEEDED_VIA_SCRIPT",
          entityType: "system",
          entityId: "singleton",
          after: JSON.stringify({ email: founder.email, name: founder.name, userId: founder.id, twoFactorEnabled: false }),
          ipAddress: "127.0.0.1",
          userAgent: "seed-founder-script",
          success: true,
        },
      });

      return founder;
    });

    console.log("  ✓ Founder created: " + result.email + " (id: " + result.id + ")");
    console.log("  ✓ SystemSettings marked as initialized");

    // Step 4: verify
    console.log("");
    console.log("Step 3: Verifying...");
    const verifyUser = await db.user.findUnique({
      where: { email: FOUNUNDER_EMAIL },
      select: { id: true, email: true, platformRole: true, familyRole: true, passwordHash: true, twoFactorEnabled: true, deletedAt: true },
    });
    const verifySettings = await db.systemSettings.findUnique({ where: { id: "singleton" } });
    const verifyRate = await db.rateLimitEntry.findMany();

    console.log("  User: " + JSON.stringify({
      id: verifyUser.id,
      email: verifyUser.email,
      platformRole: verifyUser.platformRole,
      familyRole: verifyUser.familyRole,
      hasPassword: !!verifyUser.passwordHash,
      twoFactorEnabled: verifyUser.twoFactorEnabled,
      deletedAt: verifyUser.deletedAt,
    }));
    console.log("  SystemSettings.isInitialized: " + verifySettings.isInitialized);
    console.log("  RateLimitEntry count: " + verifyRate.length + " (should be 0)");

    console.log("");
    console.log("=".repeat(72));
    console.log("  SEED COMPLETE — login is now functional");
    console.log("=".repeat(72));
    console.log("");
    console.log("  Login at: http://localhost:3000/login");
    console.log("  Email:    " + FOUNUNDER_EMAIL);
    console.log("  Password: " + FOUNDER_PASSWORD);
    console.log("");
  } catch (err) {
    console.error("  ✗ Seed failed:", err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
