# AUTH AUDIT — Planned

## Authentication Components

### Login Flow
1. User POSTs email + password to /api/auth/login
2. Rate limiter (DB-backed, 5 attempts/15min/IP)
3. User lookup by email
4. bcrypt password verification (cost 12)
5. Account lockout check (10 failed → 30 min)
6. If 2FA enabled: issue challenge token (DB-backed, 5min TTL)
7. If no 2FA: sign JWT, set HttpOnly cookie
8. Audit log entry

### Session Management
- JWT signed with HS256 using 64-char secret
- Cookie: HttpOnly, SameSite=Strict, Secure (production)
- TTL: 7 days
- Role re-read from DB on every request (getAuthUser)
- No server-side session invalidation (JWT stateless)

### Founder Setup
- One-time endpoint (/api/auth/setup)
- Returns 410 Gone after first successful run
- Transactional (User + SystemSettings in db.$transaction)
- Role hardcoded to SUPER_ADMIN (never from client)
- Optional 2FA enrollment during setup

### 2FA
- TOTP RFC 6238 (SHA-1, 30s step, 6 digits)
- Compatible with Google Authenticator, Authy, 1Password
- 8 backup codes (bcrypt-hashed, single-use)
- 2FA required for: email change, password change, security Q&A change
- 2FA required to disable 2FA (prevents password-only takeover)

### Middleware (Edge Runtime)
- Deny-by-default for /api/*
- Public allowlist: 6 auth endpoints only
- SUPER_ADMIN-only: /api/admin/*, /api/feature-flags, /api/system/*
- Browser routes: /admin, /system, /analytics, /feature-flags, /security
- Uses auth-edge.ts (jose only, no Prisma)

### Defense in Depth
1. Middleware (Edge) — JWT verification
2. Admin layout (Server) — DB re-check of role
3. API route handlers — explicit getAuthUser() + role check

## Security Tests

| Test | Result |
|---|---|
| Anonymous API access | ✅ 401 |
| Forged JWT | ✅ 401 (signature verification) |
| Direct URL access (/admin) | ✅ 307 → /login |
| Role tampering (client role field) | ✅ Ignored (hardcoded) |
| Session tampering | ✅ JWT signature prevents |
| Cookie manipulation | ✅ HttpOnly prevents JS access |
| Privilege escalation | ✅ SUPER_ADMIN only in setup |
| Setup replay | ✅ 410 Gone after first run |
| Brute force | ✅ Rate limited + lockout |
| 2FA bypass | ✅ Challenge required if enabled |

## Verdict: PASS
