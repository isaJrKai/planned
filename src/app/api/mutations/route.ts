// ============================================================================
// /api/mutations — POST handles all write operations
// ============================================================================
// Single endpoint that dispatches based on `action` field. Returns the
// updated full state so the client can hydrate in one round-trip.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  addTransaction,
  addSpendingEntry,
  giveTokens,
  redeemTokens,
  investNow,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal,
  setFamilySettings,
  setParentPhoto,
  setParentName,
  setChildPhoto,
  setChildName,
  createChild,
  createParent,
  getFullState,
} from "@/lib/db-queries";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Auth gate: same logic as /api/state — must verify session is not revoked.
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { action, payload } = body as { action: string; payload: any };

    switch (action) {
      case "addTransaction":
        await addTransaction(payload);
        break;
      case "addSpendingEntry":
        await addSpendingEntry(payload);
        break;
      case "giveTokens":
        await giveTokens(payload.childId, payload.tokens, payload.note);
        break;
      case "redeemTokens":
        await redeemTokens(payload.childId, payload.tokens, payload.cashValue);
        break;
      case "investNow":
        await investNow(payload.childId, payload.amount, payload.name, payload.type);
        break;
      case "createGoal":
        await createGoal(payload);
        break;
      case "updateGoal":
        await updateGoal(payload.id, payload.patch);
        break;
      case "deleteGoal":
        await deleteGoal(payload.id);
        break;
      case "contributeToGoal":
        await contributeToGoal(payload.id, payload.amount);
        break;
      case "setFamilySettings":
        await setFamilySettings(payload);
        break;
      case "setParentPhoto":
        await setParentPhoto(payload.parentId, payload.photo);
        break;
      case "setParentName":
        await setParentName(payload.parentId, payload.name);
        break;
      case "setChildPhoto":
        await setChildPhoto(payload.childId, payload.photo);
        break;
      case "setChildName":
        await setChildName(payload.childId, payload.name);
        break;
      case "createChild":
        await createChild(payload);
        break;
      case "createParent":
        await createParent(payload);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // Return fresh state so client hydrates in one round-trip.
    const state = await getFullState();
    return NextResponse.json({ ok: true, state });
  } catch (err) {
    console.error("POST /api/mutations failed:", err);
    return NextResponse.json(
      { error: "Mutation failed", detail: String(err) },
      { status: 500 }
    );
  }
}