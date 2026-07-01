// ============================================================================
// /api/state — GET returns full app state for client hydration
// ============================================================================

import { NextResponse } from "next/server";
import { getFullState } from "@/lib/db-queries";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user || !user.familyId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  try {
    const state = await getFullState(user.familyId);
    return NextResponse.json(state);
  } catch (err) {
    console.error("GET /api/state failed:", err);
    return NextResponse.json(
      { error: "Failed to load state", detail: String(err) },
      { status: 500 }
    );
  }
}
