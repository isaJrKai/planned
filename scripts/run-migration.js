// Load env from .env file
const fs = require('fs');
const envContent = fs.readFileSync('/home/z/my-project/.env', 'utf8');
const envLines = envContent.split('\n');
for (const line of envLines) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match && !match[1].startsWith('#')) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function runMigration() {
  console.log('=== Connecting to Neon PostgreSQL ===');
  console.log('DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':<REDACTED>@'));
  console.log('');

  // Test connection
  try {
    const userCount = await db.$queryRaw`SELECT count(*)::int as count FROM "User"`;
    console.log('✓ Connected to Neon');
    console.log('  Users in database:', userCount[0].count);
    console.log('');
  } catch (err) {
    console.error('✗ Connection failed:', err.message);
    process.exit(1);
  }

  // Migration SQL
  const migrationSQL = `
-- PART 1: Session revocation
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Session_revokedAt_idx" ON "Session"("revokedAt");
CREATE INDEX IF NOT EXISTS "Session_lastSeenAt_idx" ON "Session"("lastSeenAt");

-- PART 2: Add familyId columns
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "ParentProfile" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "SpendingCategory" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "SpendingEntry" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "Investment" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "TokenLedgerEntry" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "familyId" TEXT;

-- PART 3: Assign founder a familyId
UPDATE "User" SET "familyId" = 'fam_' || "id" WHERE "platformRole" = 'FOUNDER' AND "familyId" IS NULL;
`;

  // Execute part by part (Prisma can't run multiple statements in one $executeRawUnsafe)
  const statements = migrationSQL.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));
  
  console.log(`=== Running ${statements.length} migration statements ===`);
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;
    try {
      await db.$executeRawUnsafe(stmt);
      const preview = stmt.replace(/\s+/g, ' ').substring(0, 60);
      console.log(`  ✓ [${i+1}/${statements.length}] ${preview}...`);
    } catch (err) {
      // "already exists" errors are OK (IF NOT EXISTS should handle them, but just in case)
      if (err.message.includes('already exists')) {
        console.log(`  ⏭ [${i+1}/${statements.length}] Already exists: ${stmt.substring(0, 40)}...`);
      } else {
        console.error(`  ✗ [${i+1}/${statements.length}] FAILED: ${err.message}`);
        console.error(`    Statement: ${stmt.substring(0, 100)}`);
      }
    }
  }

  console.log('');
  console.log('=== PART 4: Backfill data to founder family ===');
  
  // Get founder familyId
  const founders = await db.$queryRaw`SELECT "familyId" FROM "User" WHERE "platformRole" = 'FOUNDER' LIMIT 1`;
  if (founders.length === 0) {
    console.log('  ⚠ No founder found — skipping backfill');
  } else {
    const familyId = founders[0].familyId;
    console.log(`  Founder familyId: ${familyId}`);
    
    for (const table of ['Child', 'ParentProfile', 'Account', 'Transaction', 'SpendingCategory', 'SpendingEntry', 'Investment', 'TokenLedgerEntry', 'Goal']) {
      const result = await db.$executeRawUnsafe(`UPDATE "${table}" SET "familyId" = $1 WHERE "familyId" IS NULL`, familyId);
      console.log(`  ✓ ${table}: ${result} rows backfilled`);
    }
  }

  console.log('');
  console.log('=== PART 5: Make familyId NOT NULL ===');
  for (const table of ['Child', 'ParentProfile', 'Account', 'Transaction', 'SpendingCategory', 'SpendingEntry', 'Investment', 'TokenLedgerEntry', 'Goal']) {
    try {
      await db.$executeRawUnsafe(`ALTER TABLE "${table}" ALTER COLUMN "familyId" SET NOT NULL`);
      console.log(`  ✓ ${table}: familyId NOT NULL`);
    } catch (err) {
      console.log(`  ⚠ ${table}: ${err.message}`);
    }
  }

  console.log('');
  console.log('=== PART 6: Add indexes ===');
  const indexStatements = [
    'CREATE INDEX IF NOT EXISTS "Child_familyId_idx" ON "Child"("familyId")',
    'CREATE INDEX IF NOT EXISTS "ParentProfile_familyId_idx" ON "ParentProfile"("familyId")',
    'CREATE INDEX IF NOT EXISTS "Account_familyId_idx" ON "Account"("familyId")',
    'CREATE INDEX IF NOT EXISTS "Transaction_familyId_idx" ON "Transaction"("familyId")',
    'CREATE INDEX IF NOT EXISTS "SpendingCategory_familyId_idx" ON "SpendingCategory"("familyId")',
    'CREATE INDEX IF NOT EXISTS "SpendingEntry_familyId_idx" ON "SpendingEntry"("familyId")',
    'CREATE INDEX IF NOT EXISTS "Investment_familyId_idx" ON "Investment"("familyId")',
    'CREATE INDEX IF NOT EXISTS "TokenLedgerEntry_familyId_idx" ON "TokenLedgerEntry"("familyId")',
    'CREATE INDEX IF NOT EXISTS "Goal_familyId_idx" ON "Goal"("familyId")',
  ];
  for (const stmt of indexStatements) {
    try {
      await db.$executeRawUnsafe(stmt);
      console.log(`  ✓ ${stmt.match(/"(\w+)_familyId_idx"/)[1]}`);
    } catch (err) {
      console.log(`  ⚠ ${err.message}`);
    }
  }

  console.log('');
  console.log('=== PART 7: Migrate FamilySettings ===');
  if (founders.length > 0) {
    const familyId = founders[0].familyId;
    try {
      await db.$executeRawUnsafe(`
        INSERT INTO "FamilySettings" ("id", "familyId", "annualTheme", "monthlyQuote", "currency", "createdAt", "updatedAt")
        SELECT 'fam_settings_' || $1, $1, 
          COALESCE((SELECT "annualTheme" FROM "FamilySettings" WHERE "id" = 'singleton'), ''),
          COALESCE((SELECT "monthlyQuote" FROM "FamilySettings" WHERE "id" = 'singleton'), ''),
          COALESCE((SELECT "currency" FROM "FamilySettings" WHERE "id" = 'singleton'), 'UGX'),
          NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM "FamilySettings" WHERE "familyId" = $1)
      `, familyId);
      console.log('  ✓ FamilySettings row created for founder family');
    } catch (err) {
      console.log(`  ⚠ ${err.message}`);
    }
    
    try {
      await db.$executeRawUnsafe(`DELETE FROM "FamilySettings" WHERE "id" = 'singleton'`);
      console.log('  ✓ Old singleton row deleted');
    } catch (err) {
      console.log(`  ⚠ ${err.message}`);
    }
  }

  console.log('');
  console.log('=== MIGRATION COMPLETE ===');
  
  // Verify
  const verifyTables = ['Session', 'Child', 'ParentProfile', 'Account', 'Transaction', 'SpendingCategory', 'SpendingEntry', 'Investment', 'TokenLedgerEntry', 'Goal'];
  console.log('');
  console.log('=== Verification ===');
  for (const table of verifyTables) {
    try {
      const hasFamilyId = table === 'Session' 
        ? await db.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name = 'Session' AND column_name IN ('revokedAt', 'lastSeenAt')`)
        : await db.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'familyId'`);
      console.log(`  ${table}: ${hasFamilyId.length > 0 ? '✓' : '✗'} has ${table === 'Session' ? 'revokedAt/lastSeenAt' : 'familyId'}`);
    } catch (err) {
      console.log(`  ${table}: ⚠ ${err.message}`);
    }
  }

  await db.$disconnect();
  console.log('');
  console.log('✅ All done! Ready to merge PR #9.');
}

runMigration().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
