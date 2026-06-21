import { NextRequest, NextResponse } from "next/server";
import { attemptLogin } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";
    if (!rateLimit(ip)) {
      return NextResponse.json({ ok: false, error: "Too many login attempts. Try again in 15 minutes." }, { status: 429 });
    }
    const body = await req.json();
    const result = await attemptLogin({ email: body.email ?? "", password: body.password ?? "", ipAddress: ip, userAgent: ua });
    if (result.twoFactorRequired) return NextResponse.json(result, { status: 200 });
    if (!result.ok) return NextResponse.json(result, { status: 401 });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    logger.error("Login endpoint error", { err });
    return NextResponse.json({ ok: false, error: "Login failed unexpectedly" }, { status: 500 });
  }
}
