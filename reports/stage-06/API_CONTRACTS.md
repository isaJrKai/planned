# API CONTRACTS — Planned

## Public API Routes

### POST /api/auth/setup
- **Auth:** Public (one-time)
- **Input:** { email, password, name, securityQuestion, securityAnswer, totpSecret?, totpVerificationCode? }
- **Output:** { ok: boolean, user?: AuthUser, error?: string }
- **Status:** 200 (success), 400 (validation), 410 (already initialized)
- **Rate limit:** None (one-time use)

### POST /api/auth/login
- **Auth:** Public
- **Input:** { email, password }
- **Output:** { ok: boolean, user?: AuthUser, twoFactorRequired?: boolean, twoFactorChallenge?: string, error?: string }
- **Status:** 200 (success/2FA challenge), 401 (invalid creds), 429 (rate limited)
- **Rate limit:** 5 attempts / 15 min / IP

### POST /api/auth/verify-2fa
- **Auth:** Public (with challenge token)
- **Input:** { challenge, code }
- **Output:** { ok: boolean, user?: AuthUser, error?: string }
- **Status:** 200 (success), 401 (invalid)

### GET /api/auth/me
- **Auth:** Public
- **Output:** { user: AuthUser | null }
- **Status:** 200

### POST /api/auth/logout
- **Auth:** Public
- **Output:** { ok: boolean }
- **Status:** 200

## Authenticated API Routes

### GET /api/state
- **Auth:** Session required
- **Output:** AppState (children, parents, accounts, transactions, spending, categories, investments, tokenLedger, goals, annualTheme, monthlyQuote)
- **Status:** 200, 401

### POST /api/mutations
- **Auth:** Session required
- **Input:** { action: string, payload: any }
- **Output:** { state?: AppState, error?: string }
- **Status:** 200, 400, 401, 500

## Admin API Routes (SUPER_ADMIN only)

### GET /api/admin/2fa/status
- **Output:** { ok, enabled, enrolledAt, backupCodesRemaining }
- **Status:** 200, 401, 403

### GET/POST /api/admin/2fa/enroll
- **GET Output:** { ok, totpSecret, qrCodeDataUrl, otpauthUrl }
- **POST Input:** { currentPassword, totpSecret, totpVerificationCode }
- **POST Output:** { ok, backupCodes?: string[] }
- **Status:** 200, 400, 401, 403

### POST /api/admin/2fa/disable
- **Input:** { currentPassword, totpCode }
- **Status:** 200, 400, 401, 403

### POST /api/admin/password
- **Input:** { currentPassword, newPassword, totpCode? }
- **Status:** 200, 400, 401, 403

### GET/POST /api/admin/security
- **GET Output:** { ok, user: { email, securityQuestion, ... } }
- **POST Input:** { currentPassword, newEmail?, newSecurityQuestion?, newSecurityAnswer?, totpCode? }
- **Status:** 200, 400, 401, 403

## Error Handling
- All routes wrapped in try/catch
- Generic error messages (no internal detail leakage)
- Error responses: { error: string } or { ok: false, error: string }
- No stack traces in production

## Verdict: PASS
