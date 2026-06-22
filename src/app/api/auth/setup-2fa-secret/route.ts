import { NextRequest, NextResponse } from "next/server";
import { generateTOTPSecret, isSystemInitialized } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const initialized = await isSystemInitialized();
    if (initialized) {
      return NextResponse.json({ ok: false, error: "System is already initialized" }, { status: 410 });
    }
    const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() || "founder@planned.app";
    const secret = await generateTOTPSecret(email);
    return NextResponse.json({ ok: true, totpSecret: secret.base32, qrCodeDataUrl: secret.qrCodeDataUrl, otpauthUrl: secret.otpauthUrl });
  } catch (err) {
    logger.error("Setup 2FA secret endpoint error", { err });
    return NextResponse.json({ ok: false, error: "Failed to generate TOTP secret" }, { status: 500 });
  }
}
