import { NextRequest, NextResponse } from "next/server";
import { attemptLogin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";

    // DB-backed rate limiting (survives restarts, works across instances)
    const { success, remaining } = await rateLimit(`login:ip:${ip}`, 5, 900);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: "Too many login attempts. Try again in 15 minutes." },
        { status: 429, headers: { "Retry-After": "900" } },
      );
    }

    const body = await req.json();
    const result = await attemptLogin({
      email: body.email ?? "",
      password: body.password ?? "",
      ipAddress: ip,
      userAgent: ua,
    });

    if (result.twoFactorRequired) return NextResponse.json(result, { status: 200 });
    if (!result.ok) return NextResponse.json(result, { status: 401 });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    logger.error("Login endpoint error", { err });
    return NextResponse.json(
      { ok: false, error: "Login failed unexpectedly" },
      { status: 500 },
    );
  }
}
