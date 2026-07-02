import { NextRequest, NextResponse } from "next/server";
import { addTransaction, addSpendingEntry, giveTokens, redeemTokens, investNow, createGoal, updateGoal, deleteGoal, contributeToGoal, setFamilySettings, setParentPhoto, setParentName, setChildPhoto, setChildName, createChild, createParent, getFullState } from "@/lib/db-queries";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !user.familyId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const familyId = user.familyId;
  try {
    const body = await req.json();
    const { action, payload } = body as { action: string; payload: any };
    switch (action) {
      case "addTransaction": await addTransaction({ ...payload, familyId }); break;
      case "addSpendingEntry": await addSpendingEntry({ ...payload, familyId }); break;
      case "giveTokens": await giveTokens(familyId, payload.childId, payload.tokens, payload.note); break;
      case "redeemTokens": await redeemTokens(familyId, payload.childId, payload.tokens, payload.cashValue); break;
      case "investNow": await investNow(familyId, payload.childId, payload.amount, payload.name, payload.type); break;
      case "createGoal": await createGoal({ ...payload, familyId }); break;
      case "updateGoal": await updateGoal(familyId, payload.id, payload.patch); break;
      case "deleteGoal": await deleteGoal(familyId, payload.id); break;
      case "contributeToGoal": await contributeToGoal(familyId, payload.id, payload.amount); break;
      case "setFamilySettings": await setFamilySettings(familyId, payload); break;
      case "setParentPhoto": await setParentPhoto(familyId, payload.parentId, payload.photo); break;
      case "setParentName": await setParentName(familyId, payload.parentId, payload.name); break;
      case "setChildPhoto": await setChildPhoto(familyId, payload.childId, payload.photo); break;
      case "setChildName": await setChildName(familyId, payload.childId, payload.name); break;
      case "createChild": await createChild({ ...payload, familyId }); break;
      case "createParent": await createParent({ ...payload, familyId }); break;
      default: return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
    const state = await getFullState(familyId);
    return NextResponse.json({ ok: true, state });
  } catch (err) {
    console.error("POST /api/mutations failed:", err);
    return NextResponse.json({ error: "Mutation failed", detail: String(err) }, { status: 500 });
  }
}
