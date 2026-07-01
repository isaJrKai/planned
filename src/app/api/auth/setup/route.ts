import { NextRequest, NextResponse } from "next/server";
import { performFounderSetup, isSystemInitialized } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const initialized = await isSystemInitialized();
    if (initialized) {
      return NextResponse.json({ ok: false, error: "System is already initialized" }, { status: 410 });
    }
    const body = await req.json();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";
    const result = await performFounderSetup({
      email: body.email ?? "", password: body.password ?? "", name: body.name ?? "",
      securityQuestion: body.securityQuestion ?? "", securityAnswer: body.securityAnswer ?? "",
      totpSecret: body.totpSecret, totpVerificationCode: body.totpVerificationCode,
      ipAddress: ip, userAgent: ua,
    });
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    logger.error("Setup endpoint error", { err });
    return NextResponse.json({ ok: false, error: "Setup failed unexpectedly" }, { status: 500 });
  }
}

export async function GET() {
  const initialized = await isSystemInitialized();
  return NextResponse.json({ setupRequired: !initialized });
}
