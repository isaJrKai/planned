import { NextRequest, NextResponse } from "next/server";
import {
  getAuthUser, verifyPassword, hashSecurityAnswer, verifyTOTP, verifyBackupCode,
  auditLog, setSessionCookie, signSession,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    if (user.role !== "SUPER_ADMIN") {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      const ua = req.headers.get("user-agent") ?? "unknown";
      await auditLog({ userId: user.id, action: "SECURITY_CHANGE_FORBIDDEN", entityType: "user", entityId: user.id, ipAddress: ip, userAgent: ua, success: false, after: { role: user.role } });
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { currentPassword, newEmail, newSecurityQuestion, newSecurityAnswer, totpCode } = body;

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json({ ok: false, error: "Current password is required" }, { status: 400 });
    }

    const dbUser = await db.user.findUnique({ where: { id: user.id, deletedAt: null } });
    if (!dbUser || !dbUser.passwordHash) return NextResponse.json({ ok: false, error: "Account not found" }, { status: 404 });

    const passwordOk = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!passwordOk) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      const ua = req.headers.get("user-agent") ?? "unknown";
      await auditLog({ userId: user.id, action: "SECURITY_CHANGE_WRONG_PASSWORD", entityType: "user", entityId: user.id, ipAddress: ip, userAgent: ua, success: false });
      return NextResponse.json({ ok: false, error: "Current password is incorrect" }, { status: 401 });
    }

    if (dbUser.twoFactorEnabled && dbUser.twoFactorSecret) {
      if (!totpCode || typeof totpCode !== "string") {
        return NextResponse.json({ ok: false, error: "2FA code is required to make security changes" }, { status: 400 });
      }
      let twoFactorOk = verifyTOTP(totpCode, dbUser.twoFactorSecret);
      if (!twoFactorOk && dbUser.twoFactorBackupCodesHash) {
        const idx = await verifyBackupCode(totpCode, dbUser.twoFactorBackupCodesHash);
        if (idx !== null) {
          twoFactorOk = true;
          const hashes: string[] = JSON.parse(dbUser.twoFactorBackupCodesHash);
          hashes.splice(idx, 1);
          await db.user.update({ where: { id: user.id }, data: { twoFactorBackupCodesHash: JSON.stringify(hashes) } });
        }
      }
      if (!twoFactorOk) {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        const ua = req.headers.get("user-agent") ?? "unknown";
        await auditLog({ userId: user.id, action: "SECURITY_CHANGE_2FA_FAILED", entityType: "user", entityId: user.id, ipAddress: ip, userAgent: ua, success: false });
        return NextResponse.json({ ok: false, error: "Invalid 2FA code" }, { status: 401 });
      }
    }

    const updates: { email?: string; securityQuestion?: string; securityAnswerHash?: string } = {};
    const changes: string[] = [];

    if (newEmail && typeof newEmail === "string") {
      const normalized = newEmail.trim().toLowerCase();
      if (!normalized.includes("@")) return NextResponse.json({ ok: false, error: "New email is invalid" }, { status: 400 });
      if (normalized !== dbUser.email) {
        const existing = await db.user.findUnique({ where: { email: normalized } });
        if (existing && existing.id !== user.id) return NextResponse.json({ ok: false, error: "Email already in use" }, { status: 400 });
        updates.email = normalized;
        changes.push("email");
      }
    }

    if (newSecurityQuestion && typeof newSecurityQuestion === "string") {
      if (newSecurityQuestion.trim().length < 10) return NextResponse.json({ ok: false, error: "Security question must be at least 10 characters" }, { status: 400 });
      if (!newSecurityAnswer || typeof newSecurityAnswer !== "string" || newSecurityAnswer.trim().length < 2) {
        return NextResponse.json({ ok: false, error: "Security answer is required when changing the question" }, { status: 400 });
      }
      updates.securityQuestion = newSecurityQuestion.trim();
      updates.securityAnswerHash = await hashSecurityAnswer(newSecurityAnswer);
      changes.push("security_question");
    }

    if (changes.length === 0) return NextResponse.json({ ok: false, error: "No changes requested" }, { status: 400 });

    const before = { email: dbUser.email, securityQuestion: dbUser.securityQuestion ? "[set]" : null };

    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: updates });
      if (updates.email) {
        await tx.systemSettings.update({ where: { id: "singleton" }, data: { superAdminEmail: updates.email } });
      }
    });

    if (updates.email) {
      const token = await signSession({ sub: user.id, email: updates.email, role: user.role });
      await setSessionCookie(token);
    }

    const after = { email: updates.email ?? dbUser.email, securityQuestion: updates.securityQuestion ? "[changed]" : before.securityQuestion };
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";

    await auditLog({
      userId: user.id, action: "SECURITY_CHANGE_OK", entityType: "user", entityId: user.id,
      before, after: { ...after, fields: changes }, ipAddress: ip, userAgent: ua, success: true,
    });

    return NextResponse.json({ ok: true, changed: changes, newEmail: updates.email ?? dbUser.email });
  } catch (err) {
    logger.error("Security change endpoint error", { err });
    return NextResponse.json({ ok: false, error: "Update failed unexpectedly" }, { status: 500 });
  }
}

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { email: true, securityQuestion: true, lastLoginAt: true, createdAt: true, twoFactorEnabled: true, twoFactorEnrolledAt: true, twoFactorBackupCodesHash: true },
  });
  let backupCodesRemaining = 0;
  if (dbUser?.twoFactorBackupCodesHash) {
    try { backupCodesRemaining = JSON.parse(dbUser.twoFactorBackupCodesHash).length; } catch { backupCodesRemaining = 0; }
  }
  return NextResponse.json({
    ok: true,
    user: {
      email: dbUser?.email,
      securityQuestion: dbUser?.securityQuestion,
      lastLoginAt: dbUser?.lastLoginAt,
      createdAt: dbUser?.createdAt,
      twoFactorEnabled: dbUser?.twoFactorEnabled,
      twoFactorEnrolledAt: dbUser?.twoFactorEnrolledAt,
      backupCodesRemaining,
    },
  });
}
