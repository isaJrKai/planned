import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, generateTOTPSecret, enroll2FA } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  if (user.twoFactorEnabled) {
    return NextResponse.json({ ok: false, error: "2FA is already enabled. Disable first to re-enroll." }, { status: 400 });
  }
  try {
    const secret = await generateTOTPSecret(user.email);
    return NextResponse.json({ ok: true, totpSecret: secret.base32, qrCodeDataUrl: secret.qrCodeDataUrl, otpauthUrl: secret.otpauthUrl });
  } catch (err) {
    logger.error("2FA enroll GET error", { err });
    return NextResponse.json({ ok: false, error: "Failed to generate secret" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";
    const result = await enroll2FA({
      userId: user.id,
      currentPassword: body.currentPassword ?? "",
      totpSecret: body.totpSecret ?? "",
      totpVerificationCode: (body.totpVerificationCode ?? "").toString().trim(),
      ipAddress: ip, userAgent: ua,
    });
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    logger.error("2FA enroll POST error", { err });
    return NextResponse.json({ ok: false, error: "Enrollment failed" }, { status: 500 });
  }
}
