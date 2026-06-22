import { NextResponse } from "next/server";
import { logout, getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();
  await logout({ userId: session?.sub });
  return NextResponse.json({ ok: true });
}
