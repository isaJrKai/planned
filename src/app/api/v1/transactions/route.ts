import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "../_shared";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);
    const txs = await db.transaction.findMany({
      where: childId ? { childId } : undefined,
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    return apiResponse({ transactions: txs.map(t => ({
      id: t.id, childId: t.childId, type: t.type, amount: t.amount,
      tokenDelta: t.tokenDelta, note: t.note, timestamp: Number(t.timestamp),
    })), meta_extra: { count: txs.length, limit }});
  } catch { return apiError("Failed to fetch transactions", 500); }
}
