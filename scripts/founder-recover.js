#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
// ============================================================================
// scripts/founder-recover.js — Development-only emergency recovery script
// ============================================================================

const { PrismaClient } = require("@prisma/client");
const readline = require("readline");

const REQUIRED_CONFIRMATION = "I UNDERSTAND THE CONSEQUENCES";

if (process.env.NODE_ENV === "production") {
  console.error("\n" + "=".repeat(72) + "\nFATAL: founder:recover is disabled in production.\n" + "=".repeat(72) + "\n");
  process.exit(1);
}
if (process.env.DISABLE_FOUNDER_RECOVERY === "true") {
  console.error("\nDISABLE_FOUNDER_RECOVERY=true is set. Refusing to run.\n");
  process.exit(1);
}
if (!process.stdin.isTTY) {
  console.error("\nFATAL: founder:recover requires an interactive terminal.\n");
  process.exit(1);
}

console.log("");
console.log("=".repeat(72));
console.log("  PLANNED — FOUNDER RECOVERY (development-only)");
console.log("=".repeat(72));
console.log("");
console.log("  This script will:");
console.log("    1. Delete the SystemSettings singleton row");
console.log("    2. Delete all SUPER_ADMIN users");
console.log("    3. Log this action to the audit trail");
console.log("");
console.log("  After this script runs, you will need to visit /setup to create a new founder.");
console.log("");

async function main() {
  const db = new PrismaClient();
  try {
    console.log("Step 1: Verifying database access...");
    const superAdmins = await db.user.findMany({ where: { role: "SUPER_ADMIN", deletedAt: null }, select: { id: true, email: true, name: true, twoFactorEnabled: true } });
    console.log("  ✓ Database OK. Current SUPER_ADMIN accounts: " + superAdmins.length);
    for (const sa of superAdmins) console.log("      - " + sa.email + " (id: " + sa.id + ", 2FA: " + sa.twoFactorEnabled + ")");
    console.log("");

    console.log("Step 2: Explicit confirmation required.");
    console.log('  Type exactly: "' + REQUIRED_CONFIRMATION + '"');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((resolve) => rl.question("Confirmation phrase: ", (a) => { rl.close(); resolve(a); }));
    if (answer.trim() !== REQUIRED_CONFIRMATION) { console.log("  ✗ Aborted. No changes made."); process.exit(0); }
    console.log("  ✓ Confirmation accepted\n");

    console.log("Step 3: 10-second countdown. Press Ctrl+C to abort.");
    for (let i = 10; i > 0; i--) { process.stdout.write("\r  Executing in " + i + " seconds... "); await new Promise((r) => setTimeout(r, 1000)); }
    process.stdout.write("\r  Executing now.                  \n\n");

    console.log("Step 4: Executing reset...");
    const superAdminIds = superAdmins.map((sa) => sa.id);
    await db.systemSettings.deleteMany({ where: { id: "singleton" } });
    console.log("  ✓ SystemSettings cleared");
    if (superAdminIds.length > 0) { await db.user.deleteMany({ where: { role: "SUPER_ADMIN" } }); console.log("  ✓ Deleted " + superAdminIds.length + " SUPER_ADMIN account(s)"); }
    await db.auditLog.create({ data: { action: "FOUNDER_RECOVERY_EXECUTED", entityType: "system", entityId: "singleton", after: JSON.stringify({ superAdminIds, isInitialized: false }), ipAddress: "127.0.0.1", userAgent: "founder-recover-script", success: true } });
    console.log("  ✓ Audit log entry written");

    console.log("\n" + "=".repeat(72) + "\n  RECOVERY COMPLETE\n" + "=".repeat(72) + "\n  Next: visit /setup in your browser to create a new founder.\n");
  } catch (err) {
    console.error("  ✗ Reset failed: " + err.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
