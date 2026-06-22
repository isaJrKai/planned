import { NextRequest, NextResponse } from "next/server";
import { completeLoginWith2FA } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";
    const result = await completeLoginWith2FA({
      challenge: body.challenge ?? "",
      code: (body.code ?? "").toString().trim(),
      ipAddress: ip, userAgent: ua,
    });
    if (!result.ok) return NextResponse.json(result, { status: 401 });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    logger.error("verify-2fa endpoint error", { err });
    return NextResponse.json({ ok: false, error: "Verification failed" }, { status: 500 });
  }
}
