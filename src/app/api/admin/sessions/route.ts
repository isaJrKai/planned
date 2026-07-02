import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, auditLog, listUserSessions, revokeSession, revokeAllUserSessions } from "@/lib/auth";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
  if (user.platformRole !== "FOUNDER") return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  const sessions = await listUserSessions(user.id);
  return NextResponse.json({ ok: true, sessions });
}
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
  if (user.platformRole !== "FOUNDER") return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = req.headers.get("user-agent") ?? "unknown";
  const body = await req.json();
  const { sessionId, all } = body as { sessionId?: string; all?: boolean };
  if (all === true) {
    const count = await revokeAllUserSessions(user.id);
    await auditLog({ userId: user.id, action: "SESSION_REVOKE_ALL", entityType: "user", entityId: user.id, ipAddress: ip, userAgent: ua, success: true, after: { count } });
    return NextResponse.json({ ok: true, revoked: count });
  }
  if (!sessionId) return NextResponse.json({ ok: false, error: "sessionId required" }, { status: 400 });
  const ok = await revokeSession(sessionId);
  if (!ok) return NextResponse.json({ ok: false, error: "Session not found or already revoked" }, { status: 404 });
  await auditLog({ userId: user.id, action: "SESSION_REVOKED", entityType: "session", entityId: sessionId, ipAddress: ip, userAgent: ua, success: true });
  return NextResponse.json({ ok: true, sessionId });
}
