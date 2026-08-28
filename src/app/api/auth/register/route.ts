import { NextRequest, NextResponse } from "next/server";
import { registerUserAsUSER, attemptLogin } from "@/lib/auth";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email ?? "";
    const password = body.password ?? "";
    const result = await registerUserAsUSER({ email, password, name: body.name ?? "" });
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    // Auto-login: create a session so the user doesn't have to re-enter credentials
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";
    const loginResult = await attemptLogin({ email, password, ipAddress: ip, userAgent: ua });
    if (loginResult.ok) {
      return NextResponse.json({ ok: true, user: loginResult.user, autoLoggedIn: true }, { status: 200 });
    }
    // If auto-login fails (shouldn't happen), fall back to old behavior
    return NextResponse.json(result, { status: 200 });
  } catch { return NextResponse.json({ ok: false, error: "Registration failed" }, { status: 500 }); }
}
