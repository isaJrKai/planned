// ============================================================================
// /api/state — GET returns full app state for client hydration
// ============================================================================

import { NextResponse } from "next/server";
import { getFullState } from "@/lib/db-queries";

export const dynamic = "force-dynamic";

export async function GET() {
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
