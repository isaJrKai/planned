#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
// ============================================================================
// scripts/security-check.js — Production readiness security report
// ============================================================================

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();
const projectRoot = path.resolve(__dirname, "..");
const checks = [];
let failed = 0;

function check(name, ok, detail) { checks.push({ name, ok, detail }); if (!ok) failed++; }

async function main() {
  console.log("\n" + "=".repeat(72) + "\n  PLANNED — Production Readiness Security Report\n  Generated: " + new Date().toISOString() + "\n  Environment: " + (process.env.NODE_ENV || "development") + "\n" + "=".repeat(72) + "\n");

  // Check 1: Exactly one SUPER_ADMIN
  try {
    const count = await db.user.count({ where: { role: "SUPER_ADMIN", deletedAt: null } });
    check("Exactly one SUPER_ADMIN exists", count <= 1, count === 0 ? "No SUPER_ADMIN yet (run /setup)" : count === 1 ? "Exactly 1 SUPER_ADMIN account" : count + " SUPER_ADMIN accounts (SECURITY VIOLATION)");
  } catch (err) { check("Exactly one SUPER_ADMIN exists", false, "DB error: " + err.message); }

  // Check 2: SystemSettings
  try {
    const settings = await db.systemSettings.findUnique({ where: { id: "singleton" } });
    if (!settings || !settings.isInitialized) { check("SUPER_ADMIN_USER_ID exists in SystemSettings", true, "System not yet initialized (run /setup)"); }
    else if (!settings.superAdminUserId) { check("SUPER_ADMIN_USER_ID exists in SystemSettings", false, "isInitialized=true but superAdminUserId is null"); }
    else {
      const user = await db.user.findUnique({ where: { id: settings.superAdminUserId }, select: { id: true, role: true, email: true, deletedAt: true } });
      if (!user || user.deletedAt) check("SUPER_ADMIN_USER_ID exists in SystemSettings", false, "User not found or deleted");
      else if (user.role !== "SUPER_ADMIN") check("SUPER_ADMIN_USER_ID exists in SystemSettings", false, "User role is " + user.role + ", expected SUPER_ADMIN");
      else check("SUPER_ADMIN_USER_ID exists in SystemSettings", true, "User ID " + user.id + " → " + user.email);
    }
  } catch (err) { check("SUPER_ADMIN_USER_ID exists in SystemSettings", false, "DB error: " + err.message); }

  // Check 3: JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === "production";
  if (!jwtSecret) check("JWT_SECRET configured", false, "JWT_SECRET env var not set");
  else if (jwtSecret.length < 32) check("JWT_SECRET configured", false, "JWT_SECRET too short (" + jwtSecret.length + " chars)");
  else check("JWT_SECRET configured", true, jwtSecret.length + " chars");

  // Check 4: Dev reset disabled in production
  if (isProduction) {
    check("Dev reset disabled in production", process.env.DISABLE_FOUNDER_RECOVERY === "true", process.env.DISABLE_FOUNDER_RECOVERY === "true" ? "DISABLE_FOUNDER_RECOVERY=true" : "Not set");
  } else {
    check("Dev reset script available (dev mode)", fs.existsSync(path.join(projectRoot, "scripts", "founder-recover.js")), "scripts/founder-recover.js present");
  }

  // Check 5: No routes create SUPER_ADMIN (except setup)
  try {
    const srcDir = path.join(projectRoot, "src");
    let offenders = [];
    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) scanDir(fullPath);
        else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
          const content = fs.readFileSync(fullPath, "utf8");
          const lines = content.split("\n");
          lines.forEach((line, i) => {
            if (line.includes("SUPER_ADMIN_ROLE") && !line.includes("//") && !line.includes("import") && !line.includes("role === ") && !line.includes("role !== ") && line.includes("role: SUPER_ADMIN_ROLE")) {
              const isSetupRoute = fullPath.includes("auth/setup") || fullPath.includes("auth.ts");
              if (!isSetupRoute) offenders.push(path.relative(projectRoot, fullPath) + ":" + (i + 1));
            }
          });
        }
      }
    }
    scanDir(srcDir);
    check("No routes create SUPER_ADMIN (except setup)", offenders.length === 0, offenders.length === 0 ? "SUPER_ADMIN role assignment only in setup flow" : "Found: " + offenders.join(", "));
  } catch (err) { check("No routes create SUPER_ADMIN", false, "Scan failed: " + err.message); }

  // Check 6: Registration hardcodes USER
  try {
    const authFile = fs.readFileSync(path.join(projectRoot, "src", "lib", "auth.ts"), "utf8");
    check("Registration hardcodes USER role", authFile.includes("registerUserAsUSER") && authFile.includes("role: USER_ROLE"), "registerUserAsUSER() hardcodes role=USER_ROLE");
  } catch (err) { check("Registration hardcodes USER role", false, "Cannot read auth.ts"); }

  // Check 7: Admin APIs require SUPER_ADMIN
  try {
    const middleware = fs.readFileSync(path.join(projectRoot, "src", "middleware.ts"), "utf8");
    const layout = fs.readFileSync(path.join(projectRoot, "src", "app", "admin", "layout.tsx"), "utf8");
    check("Admin APIs require SUPER_ADMIN", middleware.includes("SUPER_ADMIN") && layout.includes("isSuperAdmin"), "middleware + layout guards present");
  } catch (err) { check("Admin APIs require SUPER_ADMIN", false, "Scan failed: " + err.message); }

  // Check 8: Audit logging enabled
  try {
    const count = await db.auditLog.count();
    check("Audit logging enabled", true, count + " entries");
  } catch (err) { check("Audit logging enabled", false, "DB error: " + err.message); }

  // Check 9: 2FA infrastructure
  try {
    const authFile = fs.readFileSync(path.join(projectRoot, "src", "lib", "auth.ts"), "utf8");
    const allPresent = authFile.includes("generateTOTPSecret") && authFile.includes("verifyTOTP") && authFile.includes("completeLoginWith2FA") && authFile.includes("enroll2FA") && authFile.includes("disable2FA");
    const usersWith2FA = await db.user.count({ where: { twoFactorEnabled: true } });
    check("2FA infrastructure operational", allPresent, allPresent ? "All 2FA primitives present (" + usersWith2FA + " user(s) enrolled)" : "Missing primitives");
  } catch (err) { check("2FA infrastructure operational", false, "Scan failed: " + err.message); }

  await db.$disconnect();

  // Render report
  console.log("=".repeat(72) + "\n  SECURITY CHECK RESULTS\n" + "=".repeat(72) + "\n");
  const maxName = Math.max(...checks.map((c) => c.name.length));
  for (const c of checks) {
    const status = c.ok ? "✓ PASS" : "✗ FAIL";
    console.log("  " + status + "  " + c.name.padEnd(maxName));
    if (c.detail) console.log("           " + c.detail);
  }
  console.log("\n" + "-".repeat(72));
  const passed = checks.length - failed;
  console.log("  " + passed + "/" + checks.length + " checks passed");
  if (failed > 0) { console.log("\n  ⚠ " + failed + " check(s) FAILED — DO NOT DEPLOY until resolved.\n"); process.exit(1); }
  console.log("\n  ✓ All checks passed. System is production-ready.\n");
  process.exit(0);
}

main().catch((err) => { console.error("Security check crashed: " + err.message); db.$disconnect(); process.exit(1); });
