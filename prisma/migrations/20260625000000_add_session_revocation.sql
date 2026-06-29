-- Migration: Add revokedAt + lastSeenAt to Session table
-- Run this against the Neon production database BEFORE merging the PR.
--
-- How to run:
--   1. Open Neon console → your project → SQL Editor
--   2. Paste this entire file
--   3. Run
--
-- This migration is safe to run while the app is live — it adds nullable/defaulted
-- columns, which PostgreSQL handles without locking the table.

ALTER TABLE "Session" ADD COLUMN "revokedAt" TIMESTAMP(3);
ALTER TABLE "Session" ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Session_revokedAt_idx" ON "Session"("revokedAt");
CREATE INDEX "Session_lastSeenAt_idx" ON "Session"("lastSeenAt");
