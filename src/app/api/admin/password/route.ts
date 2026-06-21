import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, changePassword, auditLog } from "@/lib/auth";
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
      await auditLog({ userId: user.id, action: "PASSWORD_CHANGE_FORBIDDEN", entityType: "user", entityId: user.id, ipAddress: ip, userAgent: ua, success: false, after: { role: user.role } });
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";
    const result = await changePassword({
      userId: user.id,
      currentPassword: body.currentPassword ?? "",
      newPassword: body.newPassword ?? "",
      totpCode: body.totpCode,
      ipAddress: ip, userAgent: ua,
    });
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    logger.error("Password change endpoint error", { err });
    return NextResponse.json({ ok: false, error: "Password change failed" }, { status: 500 });
  }
}
