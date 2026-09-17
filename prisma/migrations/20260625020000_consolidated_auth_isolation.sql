-- Consolidated migration: Session revocation + Multi-family isolation
-- Run this against Neon BEFORE merging the PR.

-- PART 1: Session revocation
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Session_revokedAt_idx" ON "Session"("revokedAt");
CREATE INDEX IF NOT EXISTS "Session_lastSeenAt_idx" ON "Session"("lastSeenAt");

-- PART 2: Multi-family isolation
-- Step 1: Add nullable familyId columns
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "ParentProfile" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "SpendingCategory" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "SpendingEntry" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "Investment" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "TokenLedgerEntry" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "familyId" TEXT;

-- Step 2: Assign founder a familyId if not set
UPDATE "User" SET "familyId" = 'fam_' || "id" WHERE "platformRole" = 'FOUNDER' AND "familyId" IS NULL;

-- Step 3: Backfill all existing data with founder's familyId
DO $$
DECLARE founder_fam TEXT;
BEGIN
  SELECT "familyId" INTO founder_fam FROM "User" WHERE "platformRole" = 'FOUNDER' LIMIT 1;
  IF founder_fam IS NOT NULL THEN
    UPDATE "Child" SET "familyId" = founder_fam WHERE "familyId" IS NULL;
    UPDATE "ParentProfile" SET "familyId" = founder_fam WHERE "familyId" IS NULL;
    UPDATE "Account" SET "familyId" = founder_fam WHERE "familyId" IS NULL;
    UPDATE "Transaction" SET "familyId" = founder_fam WHERE "familyId" IS NULL;
    UPDATE "SpendingCategory" SET "familyId" = founder_fam WHERE "familyId" IS NULL;
    UPDATE "SpendingEntry" SET "familyId" = founder_fam WHERE "familyId" IS NULL;
    UPDATE "Investment" SET "familyId" = founder_fam WHERE "familyId" IS NULL;
    UPDATE "TokenLedgerEntry" SET "familyId" = founder_fam WHERE "familyId" IS NULL;
    UPDATE "Goal" SET "familyId" = founder_fam WHERE "familyId" IS NULL;
  END IF;
END $$;

-- Step 4: Make familyId NOT NULL
ALTER TABLE "Child" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "ParentProfile" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "Account" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "Transaction" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "SpendingCategory" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "SpendingEntry" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "Investment" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "TokenLedgerEntry" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "Goal" ALTER COLUMN "familyId" SET NOT NULL;

-- Step 5: Add indexes
CREATE INDEX IF NOT EXISTS "Child_familyId_idx" ON "Child"("familyId");
CREATE INDEX IF NOT EXISTS "ParentProfile_familyId_idx" ON "ParentProfile"("familyId");
CREATE INDEX IF NOT EXISTS "Account_familyId_idx" ON "Account"("familyId");
CREATE INDEX IF NOT EXISTS "Transaction_familyId_idx" ON "Transaction"("familyId");
CREATE INDEX IF NOT EXISTS "SpendingCategory_familyId_idx" ON "SpendingCategory"("familyId");
CREATE INDEX IF NOT EXISTS "SpendingEntry_familyId_idx" ON "SpendingEntry"("familyId");
CREATE INDEX IF NOT EXISTS "Investment_familyId_idx" ON "Investment"("familyId");
CREATE INDEX IF NOT EXISTS "TokenLedgerEntry_familyId_idx" ON "TokenLedgerEntry"("familyId");
CREATE INDEX IF NOT EXISTS "Goal_familyId_idx" ON "Goal"("familyId");

-- Step 6: Migrate FamilySettings from singleton to per-family
DO $$
DECLARE founder_fam TEXT;
BEGIN
  SELECT "familyId" INTO founder_fam FROM "User" WHERE "platformRole" = 'FOUNDER' LIMIT 1;
  IF founder_fam IS NOT NULL THEN
    INSERT INTO "FamilySettings" ("id", "familyId", "annualTheme", "monthlyQuote", "currency", "createdAt", "updatedAt")
    SELECT
      'fam_settings_' || founder_fam,
      founder_fam,
      COALESCE((SELECT "annualTheme" FROM "FamilySettings" WHERE "id" = 'singleton'), ''),
      COALESCE((SELECT "monthlyQuote" FROM "FamilySettings" WHERE "id" = 'singleton'), ''),
      COALESCE((SELECT "currency" FROM "FamilySettings" WHERE "id" = 'singleton'), 'UGX'),
      NOW(),
      NOW()
    WHERE NOT EXISTS (SELECT 1 FROM "FamilySettings" WHERE "familyId" = founder_fam);
  END IF;
END $$;

-- Delete old singleton row
DELETE FROM "FamilySettings" WHERE "id" = 'singleton';
