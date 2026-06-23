# DATABASE AUDIT — Planned

## Schema Overview
- **Provider:** PostgreSQL (Neon)
- **Models:** 30
- **Indexes:** 28+ across models
- **Connection:** Pooled (Neon pooler endpoint)
- **SSL:** Required (sslmode=require)

## Key Models Audit

### User (Authentication)
- ✅ email @unique
- ✅ role defaults to "USER"
- ✅ passwordHash String? (nullable for OAuth future)
- ✅ 2FA fields: twoFactorSecret, twoFactorEnabled, twoFactorEnrolledAt, twoFactorBackupCodesHash
- ✅ Security: securityQuestion, securityAnswerHash
- ✅ Lockout: failedLoginAttempts, lockedUntil
- ✅ Indexes: familyId, email, deletedAt, role

### SystemSettings (Singleton)
- ✅ id @default("singleton")
- ✅ isInitialized Boolean
- ✅ superAdminUserId (authoritative identity)
- ✅ superAdminEmail (metadata only)

### AuditLog
- ✅ success Boolean (tracks failed attempts)
- ✅ Indexes: userId+createdAt, familyId+createdAt, entityType+entityId, action

### RateLimitEntry (DB-backed rate limiting)
- ✅ key @unique
- ✅ Index on resetAt (for cleanup)

### TwoFactorChallenge (DB-backed 2FA)
- ✅ token @unique
- ✅ consumed Boolean (single-use)
- ✅ Index on expiresAt (for cleanup)

## Transaction Safety
- ✅ addTransaction: db.$transaction with atomic conditional updates
- ✅ giveTokens: db.$transaction
- ✅ redeemTokens: db.$transaction with balance re-verification
- ✅ investNow: db.$transaction with conditional updateMany
- ✅ performFounderSetup: db.$transaction (User + SystemSettings)
- ✅ /api/admin/security: db.$transaction (User + SystemSettings)

## Race Condition Protection
- ✅ investNow: conditional updateMany (where currentAmount >= amount)
- ✅ redeemTokens: re-aggregates balance inside transaction
- ✅ contributeToGoal: atomic increment
- ✅ addTransaction (withdraw): conditional updateMany prevents negative balance

## Missing Indexes (LOW priority)
- Account.childId — no index (queries filter by childId)
- Investment.childId — no index
- SpendingEntry.childId, SpendingEntry.parentId — no indexes
- Goal.childId, Goal.parentId — no indexes

## Backup Strategy
- Neon provides automatic point-in-time restore (7 days on free tier)
- No additional backup scripts needed for MVP
- For production: upgrade Neon plan for longer retention

## Recovery Plan
1. Neon dashboard → Restore → choose timestamp
2. Update DATABASE_URL in Vercel if new branch created
3. Redeploy

## Verdict: PASS (with minor index improvements recommended)
