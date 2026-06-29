// ============================================================================
// /api/state — GET returns full app state for client hydration
// ============================================================================

import { NextResponse } from "next/server";
import { getFullState } from "@/lib/db-queries";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  // Auth gate: middleware lets requests with a valid JWT through, but only
  // getAuthUser() verifies the server-side session is still active (not revoked).
  // Without this check, a logged-out user with a cached JWT could still read state.
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  try {
    const state = await getFullState();
    return NextResponse.json(state);
  } catch (err) {
    console.error("GET /api/state failed:", err);
    return NextResponse.json(
      { error: "Failed to load state", detail: String(err) },
      { status: 500 }
    );
  }
}