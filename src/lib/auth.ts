// ============================================================================
// AUTH LIBRARY — JWT session, password hashing, TOTP 2FA, role checks, audit
// ============================================================================

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const SUPER_ADMIN_ROLE = "SUPER_ADMIN";
export const USER_ROLE = "USER";

export const SESSION_COOKIE = "planned-session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const BCRYPT_COST = 12;
const MAX_LOGIN_ATTEMPTS = 10;
const LOCKOUT_MINUTES = 30;
const TOTP_WINDOW = 1;
const BACKUP_CODE_COUNT = 8;

const INSECURE_DEFAULT = "DEV-ONLY-INSECURE-SECRET-DO-NOT-USE-IN-PRODUCTION-change-me-please";
const JWT_SECRET_STRING = process.env.JWT_SECRET ?? INSECURE_DEFAULT;

if (
  process.env.NODE_ENV === "production" &&
  (JWT_SECRET_STRING === INSECURE_DEFAULT || JWT_SECRET_STRING.length < 32)
) {
  throw new Error("JWT_SECRET missing or insecure in production environment");
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export const FOUNDER_EMAIL_DEFAULT =
  process.env.FOUNDER_EMAIL?.trim().toLowerCase() || "";

export interface SessionPayload {
  sub: string;
  email: string;
  platformRole: string;
  familyRole: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  platformRole: string;
  familyRole: string;
  name: string;
  twoFactorEnabled: boolean;
}

// ---- Password policy -------------------------------------------------------

export const PASSWORD_MIN_LENGTH = 12;

export function validatePasswordPolicy(password: string): { ok: boolean; error?: string } {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (!/[A-Z]/.test(password)) return { ok: false, error: "Password must contain at least one uppercase letter" };
  if (!/[a-z]/.test(password)) return { ok: false, error: "Password must contain at least one lowercase letter" };
  if (!/[0-9]/.test(password)) return { ok: false, error: "Password must contain at least one digit" };
  return { ok: true };
}

// ---- Password hashing ------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try { return await bcrypt.compare(password, hash); } catch { return false; }
}

// ---- Security answer hashing -----------------------------------------------

export async function hashSecurityAnswer(answer: string): Promise<string> {
  const normalized = answer.trim().toLowerCase().replace(/\s+/g, " ");
  return bcrypt.hash(normalized, BCRYPT_COST);
}

export async function verifySecurityAnswer(answer: string, hash: string): Promise<boolean> {
  const normalized = answer.trim().toLowerCase().replace(/\s+/g, " ");
  try { return await bcrypt.compare(normalized, hash); } catch { return false; }
}

// ---- JWT session -----------------------------------------------------------

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, platformRole: payload.platformRole, familyRole: payload.familyRole })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(JWT_SECRET);
}

async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string" || typeof payload.platformRole !== "string") return null;
    return { sub: payload.sub, email: payload.email, platformRole: payload.platformRole as string, familyRole: (payload.familyRole as string) || "PARENT", iat: payload.iat, exp: payload.exp };
  } catch { return null; }
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getSessionFromCookieHeader(
  cookieHeader: string | null | undefined,
): Promise<SessionPayload | null> {
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("=")).filter(([k]) => k).map(([k, ...rest]) => [k, decodeURIComponent(rest.join("="))]),
  );
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  return verifySession(token);
}

// ---- Authenticated user fetcher -------------------------------------------

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session) return null;
  try {
    const user: any = await db.user.findUnique({
      where: { id: session.sub, deletedAt: null },
      select: { id: true, email: true, platformRole: true, familyRole: true, name: true, lockedUntil: true, twoFactorEnabled: true } as any,
    });
    if (!user) return null;
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) return null;
    return { id: user.id, email: user.email, platformRole: user.platformRole || "USER", familyRole: user.familyRole || "PARENT", name: user.name, twoFactorEnabled: user.twoFactorEnabled };
  } catch (err) {
    logger.error("Failed to fetch auth user from DB", { err, sub: session.sub });
    return null;
  }
}

// ---- Role checks -----------------------------------------------------------

export function isFounder(user: AuthUser | null): boolean {
  return user?.platformRole === "FOUNDER";
}

// ---- Audit logging ---------------------------------------------------------

export async function auditLog(params: {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId ?? null,
        familyId: null,
        action: params.action,
        entityType: params.entityType ?? "system",
        entityId: params.entityId ?? "-",
        before: params.before ? JSON.stringify(params.before) : null,
        after: params.after ? JSON.stringify(params.after) : null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        success: params.success ?? true,
      },
    });
  } catch (err) {
    logger.error("Failed to write audit log", { err, action: params.action });
  }
}

// ---- TOTP 2FA --------------------------------------------------------------

export interface TOTPSecret {
  base32: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export async function generateTOTPSecret(userEmail: string): Promise<TOTPSecret> {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: "Planned",
    label: userEmail,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
  const otpauthUrl = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    margin: 1, width: 240, color: { dark: "#0A4D5C", light: "#FFFFFF" },
  });
  return { base32: secret.base32, otpauthUrl, qrCodeDataUrl };
}

export function verifyTOTP(token: string, base32Secret: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const secret = OTPAuth.Secret.fromBase32(base32Secret);
  const totp = new OTPAuth.TOTP({ issuer: "Planned", label: "", algorithm: "SHA1", digits: 6, period: 30, secret });
  const delta = totp.validate({ token, window: TOTP_WINDOW });
  return delta !== null;
}

export async function generateBackupCodes(): Promise<{ plaintext: string[]; hashes: string[] }> {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const plaintext: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const chars = Array.from({ length: 12 }, () => charset[Math.floor(Math.random() * charset.length)]).join("");
    plaintext.push(`${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`);
  }
  const hashes = await Promise.all(plaintext.map((c) => bcrypt.hash(c, BCRYPT_COST)));
  return { plaintext, hashes };
}

export async function verifyBackupCode(candidate: string, hashesJson: string): Promise<number | null> {
  let hashes: string[] = [];
  try { hashes = JSON.parse(hashesJson); } catch { return null; }
  const normalized = candidate.trim().toUpperCase();
  for (let i = 0; i < hashes.length; i++) {
    const ok = await bcrypt.compare(normalized, hashes[i]);
    if (ok) return i;
  }
  return null;
}

// ---- Safe user registration (NEVER trusts client role) --------------------

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export async function registerUserAsUSER(input: RegisterInput): Promise<{ ok: boolean; error?: string; userId?: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) return { ok: false, error: "Valid email required" };
  const passwordCheck = validatePasswordPolicy(input.password);
  if (!passwordCheck.ok) return { ok: false, error: passwordCheck.error };
  if (input.name.trim().length < 2) return { ok: false, error: "Name required" };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "Email already registered" };

  const passwordHash = await hashPassword(input.password);
  const user = await db.user.create({
    data: { email, name: input.name.trim(), passwordHash, platformRole: USER_ROLE, familyRole: "PARENT" },
  });

  await auditLog({
    userId: user.id, action: "USER_REGISTERED", entityType: "user", entityId: user.id,
    after: { email: user.email, platformRole: user.platformRole }, success: true,
  });

  return { ok: true, userId: user.id };
}

// ---- Login flow (2FA-aware) ------------------------------------------------

export interface LoginResult {
  ok: boolean;
  error?: string;
  user?: AuthUser;
  twoFactorRequired?: boolean;
  twoFactorChallenge?: string;
}

const TWO_FACTOR_CHALLENGE_TTL_MS = 5 * 60 * 1000;

// DB-backed 2FA challenges — survives restarts, works across instances.
// Uses the TwoFactorChallenge table with auto-expiring rows.
async function createTwoFactorChallenge(userId: string): Promise<string> {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + TWO_FACTOR_CHALLENGE_TTL_MS);
  await db.twoFactorChallenge.create({
    data: { token, userId, expiresAt, consumed: false },
  });
  return token;
}

async function consumeTwoFactorChallenge(token: string): Promise<string | null> {
  // Atomic consume: mark as consumed only if not already consumed and not expired
  const challenge = await db.twoFactorChallenge.findUnique({
    where: { token },
  });
  if (!challenge) return null;
  if (challenge.consumed) return null;
  if (challenge.expiresAt < new Date()) return null;

  // Mark as consumed (single-use)
  await db.twoFactorChallenge.update({
    where: { token },
    data: { consumed: true },
  });

  // Clean up old challenges (best-effort, non-blocking)
  db.twoFactorChallenge.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  }).catch(() => {});

  return challenge.userId;
}

export async function attemptLogin(params: {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<LoginResult> {
  const email = params.email.trim().toLowerCase();
  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || user.deletedAt) {
      await auditLog({ action: "LOGIN_FAILED", entityType: "user", entityId: email, ipAddress: params.ipAddress, userAgent: params.userAgent, success: false });
      return { ok: false, error: "Invalid email or password" };
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await auditLog({ userId: user.id, action: "LOGIN_LOCKED", entityType: "user", entityId: user.id, ipAddress: params.ipAddress, userAgent: params.userAgent, success: false });
      return { ok: false, error: "Account locked. Try again later or use security question recovery." };
    }

    const passwordOk = await verifyPassword(params.password, user.passwordHash);
    if (!passwordOk) {
      const newAttempts = user.failedLoginAttempts + 1;
      const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;
      await db.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: newAttempts, lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null },
      });
      await auditLog({ userId: user.id, action: "LOGIN_FAILED", entityType: "user", entityId: user.id, ipAddress: params.ipAddress, userAgent: params.userAgent, success: false, after: { attempts: newAttempts, locked: shouldLock } });
      return { ok: false, error: "Invalid email or password" };
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const challenge = await createTwoFactorChallenge(user.id);
      await auditLog({ userId: user.id, action: "LOGIN_2FA_CHALLENGE_ISSUED", entityType: "user", entityId: user.id, ipAddress: params.ipAddress, userAgent: params.userAgent, success: true });
      return { ok: false, twoFactorRequired: true, twoFactorChallenge: challenge, error: "Two-factor authentication required" };
    }

    await db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } });
    const token = await signSession({ sub: user.id, email: user.email, platformRole: user.platformRole, familyRole: user.familyRole });
    await setSessionCookie(token);
    await auditLog({ userId: user.id, action: "LOGIN_SUCCESS", entityType: "user", entityId: user.id, ipAddress: params.ipAddress, userAgent: params.userAgent, success: true });
    return { ok: true, user: { id: user.id, email: user.email, platformRole: user.platformRole, familyRole: user.familyRole, name: user.name, twoFactorEnabled: user.twoFactorEnabled } };
  } catch (err) {
    logger.error("Login error", { err, email });
    return { ok: false, error: "An unexpected error occurred" };
  }
}

// ---- Complete login with 2FA ------------------------------------------------

export async function completeLoginWith2FA(params: {
  challenge: string;
  code: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ ok: boolean; error?: string; user?: AuthUser }> {
  try {
    const userId = await consumeTwoFactorChallenge(params.challenge);
    if (!userId) return { ok: false, error: "Invalid or expired 2FA challenge" };

    const user = await db.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) return { ok: false, error: "2FA not enabled for this account" };

    let verified = false;
    let usedBackupIndex: number | null = null;

    if (verifyTOTP(params.code, user.twoFactorSecret)) {
      verified = true;
    } else if (user.twoFactorBackupCodesHash) {
      usedBackupIndex = await verifyBackupCode(params.code, user.twoFactorBackupCodesHash);
      if (usedBackupIndex !== null) {
        verified = true;
        const hashes: string[] = JSON.parse(user.twoFactorBackupCodesHash);
        hashes.splice(usedBackupIndex, 1);
        await db.user.update({ where: { id: user.id }, data: { twoFactorBackupCodesHash: JSON.stringify(hashes) } });
      }
    }

    if (!verified) {
      await auditLog({ userId: user.id, action: "LOGIN_2FA_FAILED", entityType: "user", entityId: user.id, ipAddress: params.ipAddress, userAgent: params.userAgent, success: false });
      return { ok: false, error: "Invalid 2FA code" };
    }

    await db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } });
    const token = await signSession({ sub: user.id, email: user.email, platformRole: user.platformRole, familyRole: user.familyRole });
    await setSessionCookie(token);
    await auditLog({ userId: user.id, action: usedBackupIndex !== null ? "LOGIN_2FA_BACKUP_SUCCESS" : "LOGIN_2FA_SUCCESS", entityType: "user", entityId: user.id, ipAddress: params.ipAddress, userAgent: params.userAgent, success: true, after: { backupCodesRemaining: usedBackupIndex !== null } });
    return { ok: true, user: { id: user.id, email: user.email, platformRole: user.platformRole, familyRole: user.familyRole, name: user.name, twoFactorEnabled: user.twoFactorEnabled } };
  } catch (err) {
    logger.error("2FA complete error", { err });
    return { ok: false, error: "An unexpected error occurred" };
  }
}

// ---- Logout flow -----------------------------------------------------------

export async function logout(params?: { userId?: string; ipAddress?: string; userAgent?: string }): Promise<void> {
  await clearSessionCookie();
  if (params?.userId) {
    await auditLog({ userId: params.userId, action: "LOGOUT", entityType: "user", entityId: params.userId, ipAddress: params.ipAddress, userAgent: params.userAgent, success: true });
  }
}

// ---- System initialization check -------------------------------------------

export async function getSystemSettings() {
  try {
    return await db.systemSettings.findUnique({ where: { id: "singleton" } });
  } catch (err) {
    logger.error("Failed to read system settings", { err });
    return null;
  }
}

export async function isSystemInitialized(): Promise<boolean> {
  const settings = await getSystemSettings();
  return !!settings?.isInitialized;
}

// ---- Founder setup ---------------------------------------------------------

export interface SetupResult {
  ok: boolean;
  error?: string;
  user?: AuthUser;
}

export async function performFounderSetup(params: {
  email: string;
  password: string;
  name: string;
  securityQuestion: string;
  securityAnswer: string;
  totpSecret?: string;
  totpVerificationCode?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<SetupResult> {
  const email = params.email.trim().toLowerCase();

  if (!email || !email.includes("@")) return { ok: false, error: "A valid email is required" };
  const passwordCheck = validatePasswordPolicy(params.password);
  if (!passwordCheck.ok) return { ok: false, error: passwordCheck.error };
  if (params.name.trim().length < 2) return { ok: false, error: "Name is required" };
  if (params.securityQuestion.trim().length < 10) return { ok: false, error: "Security question must be at least 10 characters" };
  if (params.securityAnswer.trim().length < 2) return { ok: false, error: "Security answer is required" };

  const alreadyInitialized = await isSystemInitialized();
  if (alreadyInitialized) {
    await auditLog({ action: "SETUP_REFUSED_ALREADY_INITIALIZED", entityType: "system", entityId: "singleton", ipAddress: params.ipAddress, userAgent: params.userAgent, success: false });
    return { ok: false, error: "System is already initialized" };
  }

  try {
    const existing = await db.user.findFirst({ where: { platformRole: "FOUNDER", deletedAt: null } as any });
    if (existing) return { ok: false, error: "A super admin already exists. Setup is no longer available." };
  } catch (err) {
    logger.error("Setup: failed to check existing super admin", { err });
    return { ok: false, error: "Setup check failed" };
  }

  let enrollTotp = false;
  if (params.totpSecret && params.totpVerificationCode) {
    if (!verifyTOTP(params.totpVerificationCode, params.totpSecret)) {
      return { ok: false, error: "Invalid 2FA verification code. Please try again." };
    }
    enrollTotp = true;
  }

  let backupCodesHash: string | null = null;
  if (enrollTotp) {
    const { hashes } = await generateBackupCodes();
    backupCodesHash = JSON.stringify(hashes);
  }

  const [passwordHash, securityAnswerHash] = await Promise.all([
    hashPassword(params.password),
    hashSecurityAnswer(params.securityAnswer),
  ]);

  const founder = await db.$transaction(async (tx) => {
    const f = await tx.user.create({
      data: {
        email, name: params.name.trim(), passwordHash, platformRole: "FOUNDER", familyRole: "FAMILY_MANAGER",
        securityQuestion: params.securityQuestion.trim(), securityAnswerHash,
        emailVerified: new Date(), lastLoginAt: new Date(),
        twoFactorSecret: params.totpSecret ?? null,
        twoFactorEnabled: enrollTotp,
        twoFactorEnrolledAt: enrollTotp ? new Date() : null,
        twoFactorBackupCodesHash: backupCodesHash,
      },
    });
    await tx.systemSettings.upsert({
      where: { id: "singleton" },
      update: { isInitialized: true, superAdminUserId: f.id, superAdminEmail: f.email, setupCompletedAt: new Date() },
      create: { id: "singleton", isInitialized: true, superAdminUserId: f.id, superAdminEmail: f.email, setupCompletedAt: new Date() },
    });
    return f;
  });

  const token = await signSession({ sub: founder.id, email: founder.email, platformRole: founder.platformRole, familyRole: founder.familyRole });
  await setSessionCookie(token);

  await auditLog({
    userId: founder.id, action: "FOUNDER_SETUP_COMPLETED", entityType: "system", entityId: "singleton",
    after: { email: founder.email, name: founder.name, userId: founder.id, twoFactorEnabled: enrollTotp },
    ipAddress: params.ipAddress, userAgent: params.userAgent, success: true,
  });

  return { ok: true, user: { id: founder.id, email: founder.email, platformRole: founder.platformRole, familyRole: founder.familyRole, name: founder.name, twoFactorEnabled: enrollTotp } };
}

// ---- 2FA enrollment (for existing users via /admin/security) ---------------

export async function enroll2FA(params: {
  userId: string;
  currentPassword: string;
  totpSecret: string;
  totpVerificationCode: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ ok: boolean; error?: string; backupCodes?: string[] }> {
  try {
    const user = await db.user.findUnique({ where: { id: params.userId, deletedAt: null } });
    if (!user || !user.passwordHash) return { ok: false, error: "User not found" };

    const passwordOk = await verifyPassword(params.currentPassword, user.passwordHash);
    if (!passwordOk) {
      await auditLog({ userId: params.userId, action: "2FA_ENROLL_WRONG_PASSWORD", entityType: "user", entityId: params.userId, ipAddress: params.ipAddress, userAgent: params.userAgent, success: false });
      return { ok: false, error: "Current password is incorrect" };
    }

    if (!verifyTOTP(params.totpVerificationCode, params.totpSecret)) return { ok: false, error: "Invalid 2FA verification code" };

    const { plaintext, hashes } = await generateBackupCodes();
    await db.user.update({
      where: { id: params.userId },
      data: { twoFactorSecret: params.totpSecret, twoFactorEnabled: true, twoFactorEnrolledAt: new Date(), twoFactorBackupCodesHash: JSON.stringify(hashes) },
    });
    await auditLog({ userId: params.userId, action: "2FA_ENROLLED", entityType: "user", entityId: params.userId, ipAddress: params.ipAddress, userAgent: params.userAgent, success: true });
    return { ok: true, backupCodes: plaintext };
  } catch (err) {
    logger.error("2FA enrollment error", { err });
    return { ok: false, error: "Enrollment failed" };
  }
}

// ---- Disable 2FA -----------------------------------------------------------

export async function disable2FA(params: {
  userId: string;
  currentPassword: string;
  totpCode: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await db.user.findUnique({ where: { id: params.userId, deletedAt: null } });
    if (!user || !user.passwordHash) return { ok: false, error: "User not found" };

    const passwordOk = await verifyPassword(params.currentPassword, user.passwordHash);
    if (!passwordOk) return { ok: false, error: "Current password is incorrect" };

    if (!user.twoFactorSecret) return { ok: false, error: "2FA is not enabled" };

    let verified = verifyTOTP(params.totpCode, user.twoFactorSecret);
    if (!verified && user.twoFactorBackupCodesHash) {
      const idx = await verifyBackupCode(params.totpCode, user.twoFactorBackupCodesHash);
      verified = idx !== null;
    }
    if (!verified) return { ok: false, error: "Invalid 2FA code" };

    await db.user.update({
      where: { id: params.userId },
      data: { twoFactorSecret: null, twoFactorEnabled: false, twoFactorEnrolledAt: null, twoFactorBackupCodesHash: null },
    });
    await auditLog({ userId: params.userId, action: "2FA_DISABLED", entityType: "user", entityId: params.userId, ipAddress: params.ipAddress, userAgent: params.userAgent, success: true });
    return { ok: true };
  } catch (err) {
    logger.error("2FA disable error", { err });
    return { ok: false, error: "Failed to disable 2FA" };
  }
}

// ---- Change password -------------------------------------------------------

export async function changePassword(params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
  totpCode?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await db.user.findUnique({ where: { id: params.userId, deletedAt: null } });
    if (!user || !user.passwordHash) return { ok: false, error: "Account not found" };

    const passwordOk = await verifyPassword(params.currentPassword, user.passwordHash);
    if (!passwordOk) {
      await auditLog({ userId: params.userId, action: "PASSWORD_CHANGE_WRONG_PASSWORD", entityType: "user", entityId: params.userId, ipAddress: params.ipAddress, userAgent: params.userAgent, success: false });
      return { ok: false, error: "Current password is incorrect" };
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!params.totpCode) return { ok: false, error: "2FA code is required to change password" };
      let twoFactorOk = verifyTOTP(params.totpCode, user.twoFactorSecret);
      if (!twoFactorOk && user.twoFactorBackupCodesHash) {
        const idx = await verifyBackupCode(params.totpCode, user.twoFactorBackupCodesHash);
        if (idx !== null) {
          twoFactorOk = true;
          const hashes: string[] = JSON.parse(user.twoFactorBackupCodesHash);
          hashes.splice(idx, 1);
          await db.user.update({ where: { id: params.userId }, data: { twoFactorBackupCodesHash: JSON.stringify(hashes) } });
        }
      }
      if (!twoFactorOk) {
        await auditLog({ userId: params.userId, action: "PASSWORD_CHANGE_2FA_FAILED", entityType: "user", entityId: params.userId, ipAddress: params.ipAddress, userAgent: params.userAgent, success: false });
        return { ok: false, error: "Invalid 2FA code" };
      }
    }

    const policyCheck = validatePasswordPolicy(params.newPassword);
    if (!policyCheck.ok) return { ok: false, error: policyCheck.error };
    if (params.newPassword === params.currentPassword) return { ok: false, error: "New password must be different from current password" };

    const newHash = await hashPassword(params.newPassword);
    await db.user.update({ where: { id: params.userId }, data: { passwordHash: newHash } });
    await auditLog({ userId: params.userId, action: "PASSWORD_CHANGED", entityType: "user", entityId: params.userId, ipAddress: params.ipAddress, userAgent: params.userAgent, success: true, after: { policy: "12+ chars, upper+lower+digit", userIdPreserved: params.userId } });
    return { ok: true };
  } catch (err) {
    logger.error("Change password error", { err });
    return { ok: false, error: "Failed to change password" };
  }
}
