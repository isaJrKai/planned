-- Migration: Add familyId to all financial models for multi-family isolation
-- Run this against the Neon production database BEFORE merging the PR.
--
-- This migration:
--   1. Adds familyId column to 9 tables (nullable first, for backfill)
--   2. Backfills all existing data to the founder's familyId
--   3. Makes familyId NOT NULL
--   4. Drops the old FamilySettings singleton row, creates per-family rows
--   5. Adds indexes
--
-- How to run:
--   1. Open Neon console → SQL Editor
--   2. Paste this entire file
--   3. Run
--
-- IMPORTANT: Run this BEFORE merging the PR. The app will work with the old
-- schema until you merge, but the new code expects familyId to exist.

-- Step 1: Add nullable familyId columns
ALTER TABLE "Child" ADD COLUMN "familyId" TEXT;
ALTER TABLE "ParentProfile" ADD COLUMN "familyId" TEXT;
ALTER TABLE "Account" ADD COLUMN "familyId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "familyId" TEXT;
ALTER TABLE "SpendingCategory" ADD COLUMN "familyId" TEXT;
ALTER TABLE "SpendingEntry" ADD COLUMN "familyId" TEXT;
ALTER TABLE "Investment" ADD COLUMN "familyId" TEXT;
ALTER TABLE "TokenLedgerEntry" ADD COLUMN "familyId" TEXT;
ALTER TABLE "Goal" ADD COLUMN "familyId" TEXT;

-- Step 2: Get the founder's userId from SystemSettings
-- We'll use this as the familyId for all existing data.
-- The founder's User row already has a familyId column (nullable).
-- We'll generate a new familyId for the founder and assign all existing data to it.

-- First, set the founder's familyId if not set
UPDATE "User"
SET "familyId" = 'fam_' || "id"
WHERE "platformRole" = 'FOUNDER' AND "familyId" IS NULL;

-- Now backfill all existing data with the founder's familyId
-- (If there are multiple founders, this assigns to the first one — acceptable for migration)
UPDATE "Child" SET "familyId" = (SELECT "familyId" FROM "User" WHERE "platformRole" = 'FOUNDER' LIMIT 1) WHERE "familyId" IS NULL;
UPDATE "ParentProfile" SET "familyId" = (SELECT "familyId" FROM "User" WHERE "platformRole" = 'FOUNDER' LIMIT 1) WHERE "familyId" IS NULL;
UPDATE "Account" SET "familyId" = (SELECT "familyId" FROM "User" WHERE "platformRole" = 'FOUNDER' LIMIT 1) WHERE "familyId" IS NULL;
UPDATE "Transaction" SET "familyId" = (SELECT "familyId" FROM "User" WHERE "platformRole" = 'FOUNDER' LIMIT 1) WHERE "familyId" IS NULL;
UPDATE "SpendingCategory" SET "familyId" = (SELECT "familyId" FROM "User" WHERE "platformRole" = 'FOUNDER' LIMIT 1) WHERE "familyId" IS NULL;
UPDATE "SpendingEntry" SET "familyId" = (SELECT "familyId" FROM "User" WHERE "platformRole" = 'FOUNDER' LIMIT 1) WHERE "familyId" IS NULL;
UPDATE "Investment" SET "familyId" = (SELECT "familyId" FROM "User" WHERE "platformRole" = 'FOUNDER' LIMIT 1) WHERE "familyId" IS NULL;
UPDATE "TokenLedgerEntry" SET "familyId" = (SELECT "familyId" FROM "User" WHERE "platformRole" = 'FOUNDER' LIMIT 1) WHERE "familyId" IS NULL;
UPDATE "Goal" SET "familyId" = (SELECT "familyId" FROM "User" WHERE "platformRole" = 'FOUNDER' LIMIT 1) WHERE "familyId" IS NULL;

-- Step 3: Make familyId NOT NULL
ALTER TABLE "Child" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "ParentProfile" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "Account" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "Transaction" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "SpendingCategory" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "SpendingEntry" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "Investment" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "TokenLedgerEntry" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "Goal" ALTER COLUMN "familyId" SET NOT NULL;

-- Step 4: Drop old FamilySettings singleton, create per-family row
-- First, get the founder's familyId and create a FamilySettings row for it
INSERT INTO "FamilySettings" ("id", "familyId", "annualTheme", "monthlyQuote", "currency", "createdAt", "updatedAt")
SELECT
  'fam_settings_' || "familyId",
  "familyId",
  COALESCE((SELECT "annualTheme" FROM "FamilySettings" WHERE "id" = 'singleton'), ''),
  COALESCE((SELECT "monthlyQuote" FROM "FamilySettings" WHERE "id" = 'singleton'), ''),
  COALESCE((SELECT "currency" FROM "FamilySettings" WHERE "id" = 'singleton'), 'UGX'),
  NOW(),
  NOW()
FROM "User" WHERE "platformRole" = 'FOUNDER' AND "familyId" IS NOT NULL;

-- Delete the old singleton row
DELETE FROM "FamilySettings" WHERE "id" = 'singleton';

-- Step 5: Add indexes
CREATE INDEX "Child_familyId_idx" ON "Child"("familyId");
CREATE INDEX "ParentProfile_familyId_idx" ON "ParentProfile"("familyId");
CREATE INDEX "Account_familyId_idx" ON "Account"("familyId");
CREATE INDEX "Transaction_familyId_idx" ON "Transaction"("familyId");
CREATE INDEX "SpendingCategory_familyId_idx" ON "SpendingCategory"("familyId");
CREATE INDEX "SpendingEntry_familyId_idx" ON "SpendingEntry"("familyId");
CREATE INDEX "Investment_familyId_idx" ON "Investment"("familyId");
CREATE INDEX "TokenLedgerEntry_familyId_idx" ON "TokenLedgerEntry"("familyId");
CREATE INDEX "Goal_familyId_idx" ON "Goal"("familyId");
