import { NextResponse } from "next/server";
import { logout, getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  // Read the sessionId from the JWT BEFORE clearing the cookie — we need it
  // to revoke the server-side session record. This is the key fix: logout
  // now invalidates the session server-side, so even if the cookie survives
  // (browser quirks, cached JWT, another tab), the session is dead.
  const session = await getSession();
  await logout({
    userId: session?.sub,
    sessionId: session?.sessionId,
  });
  return NextResponse.json({ ok: true });
}