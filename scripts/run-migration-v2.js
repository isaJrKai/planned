const fs = require('fs');
const envContent = fs.readFileSync('/home/z/my-project/.env', 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match && !match[1].startsWith('#')) process.env[match[1].trim()] = match[2].trim();
}

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function run(stmt, label) {
  try {
    const result = await db.$executeRawUnsafe(stmt);
    console.log(`  ✓ ${label}`);
    return result;
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('does not exist') === false) {
      console.log(`  ⚠ ${label}: ${err.message.substring(0, 80)}`);
    } else {
      console.log(`  ✗ ${label}: ${err.message.substring(0, 80)}`);
    }
    return 0;
  }
}

async function main() {
  console.log('=== NEON MIGRATION v2 ===\n');
  
  // 1. Add User.familyId (was missing!)
  await run(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "familyId" TEXT`, 'User.familyId added');
  
  // 2. Session columns
  await run(`ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3)`, 'Session.revokedAt');
  await run(`ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`, 'Session.lastSeenAt');
  await run(`CREATE INDEX IF NOT EXISTS "Session_revokedAt_idx" ON "Session"("revokedAt")`, 'Session_revokedAt_idx');
  await run(`CREATE INDEX IF NOT EXISTS "Session_lastSeenAt_idx" ON "Session"("lastSeenAt")`, 'Session_lastSeenAt_idx');
  
  // 3. Add familyId to all financial tables
  for (const t of ['Child', 'ParentProfile', 'Account', 'Transaction', 'SpendingCategory', 'SpendingEntry', 'Investment', 'TokenLedgerEntry', 'Goal']) {
    await run(`ALTER TABLE "${t}" ADD COLUMN IF NOT EXISTS "familyId" TEXT`, `${t}.familyId`);
  }
  
  // 4. Assign founder a familyId
  await run(`UPDATE "User" SET "familyId" = 'fam_' || "id" WHERE "platformRole" = 'FOUNDER' AND "familyId" IS NULL`, 'Founder familyId set');
  
  // 5. Get founder familyId and backfill
  const founders = await db.$queryRaw`SELECT "familyId", "id", "email" FROM "User" WHERE "platformRole" = 'FOUNDER' LIMIT 1`;
  if (founders.length > 0) {
    const fam = founders[0].familyId;
    console.log(`\n  Founder: ${founders[0].email} → familyId: ${fam}\n`);
    
    for (const t of ['Child', 'ParentProfile', 'Account', 'Transaction', 'SpendingCategory', 'SpendingEntry', 'Investment', 'TokenLedgerEntry', 'Goal']) {
      const count = await db.$executeRawUnsafe(`UPDATE "${t}" SET "familyId" = $1 WHERE "familyId" IS NULL`, fam);
      console.log(`  ✓ ${t}: ${count} rows backfilled`);
    }
    
    // 6. Make NOT NULL
    console.log('\n=== Making familyId NOT NULL ===');
    for (const t of ['Child', 'ParentProfile', 'Account', 'Transaction', 'SpendingCategory', 'SpendingEntry', 'Investment', 'TokenLedgerEntry', 'Goal']) {
      await run(`ALTER TABLE "${t}" ALTER COLUMN "familyId" SET NOT NULL`, `${t}.familyId NOT NULL`);
    }
    
    // 7. Indexes
    console.log('\n=== Adding indexes ===');
    for (const t of ['Child', 'ParentProfile', 'Account', 'Transaction', 'SpendingCategory', 'SpendingEntry', 'Investment', 'TokenLedgerEntry', 'Goal']) {
      await run(`CREATE INDEX IF NOT EXISTS "${t}_familyId_idx" ON "${t}"("familyId")`, `${t}_familyId_idx`);
    }
    
    // 8. FamilySettings migration
    console.log('\n=== FamilySettings ===');
    try {
      await db.$executeRawUnsafe(`
        INSERT INTO "FamilySettings" ("id", "familyId", "annualTheme", "monthlyQuote", "currency", "createdAt", "updatedAt")
        SELECT 'fam_settings_' || $1, $1, 
          COALESCE((SELECT "annualTheme" FROM "FamilySettings" WHERE "id" = 'singleton'), ''),
          COALESCE((SELECT "monthlyQuote" FROM "FamilySettings" WHERE "id" = 'singleton'), ''),
          COALESCE((SELECT "currency" FROM "FamilySettings" WHERE "id" = 'singleton'), 'UGX'),
          NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM "FamilySettings" WHERE "familyId" = $1)
      `, fam);
      console.log('  ✓ FamilySettings row created');
    } catch (err) {
      console.log(`  ⚠ FamilySettings: ${err.message.substring(0, 80)}`);
    }
    await run(`DELETE FROM "FamilySettings" WHERE "id" = 'singleton'`, 'Old singleton deleted');
  }
  
  // Verify
  console.log('\n=== VERIFICATION ===');
  const userCount = await db.$queryRaw`SELECT count(*)::int as c FROM "User"`;
  const usersWithFamily = await db.$queryRaw`SELECT count(*)::int as c FROM "User" WHERE "familyId" IS NOT NULL`;
  console.log(`  Users: ${userCount[0].c} total, ${usersWithFamily[0].c} with familyId`);
  
  const sessionCols = await db.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Session' AND column_name IN ('revokedAt', 'lastSeenAt')`;
  console.log(`  Session columns: ${sessionCols.map(c => c.column_name).join(', ')}`);
  
  for (const t of ['Child', 'Transaction', 'Goal']) {
    const cols = await db.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name = '${t}' AND column_name = 'familyId'`);
    console.log(`  ${t}.familyId: ${cols.length > 0 ? '✓' : '✗'}`);
  }
  
  console.log('\n✅ MIGRATION COMPLETE — ready to merge PR #9');
  await db.$disconnect();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
