import { NextRequest, NextResponse } from "next/server";
import { registerUserAsUSER } from "@/lib/auth";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await registerUserAsUSER({ email: body.email ?? "", password: body.password ?? "", name: body.name ?? "" });
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 200 });
  } catch { return NextResponse.json({ ok: false, error: "Registration failed" }, { status: 500 }); }
}
