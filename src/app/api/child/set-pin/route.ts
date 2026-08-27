import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthUser, auditLog } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    if (user.platformRole !== "FOUNDER" && user.familyRole !== "FAMILY_MANAGER" && user.familyRole !== "PARENT") {
      return NextResponse.json({ ok: false, error: "Only parents can set child PINs" }, { status: 403 });
    }

    const body = await req.json();
    const { childId, pin, nickname, animalCompanion } = body;
    if (!childId || !pin || pin.length !== 4) return NextResponse.json({ ok: false, error: "Child ID and 4-digit PIN required" }, { status: 400 });

    const child = await db.child.findUnique({ where: { id: childId } });
    if (!child) return NextResponse.json({ ok: false, error: "Child not found" }, { status: 404 });

    let childProfile = await db.childProfile.findFirst({ where: { childId } });
    let childUser;

    if (childProfile) {
      childUser = await db.user.findUnique({ where: { id: childProfile.userId } });
    } else {
      childUser = await db.user.create({ data: { email: `child-${childId}@planned.local`, name: child.name, platformRole: "USER", familyRole: "CHILD", childId } });
      childProfile = await db.childProfile.create({ data: { userId: childUser.id, childId, nickname: nickname || child.name, animalCompanion: animalCompanion || null } });
      await db.childPreferences.create({ data: { childId: childProfile.id } });
    }

    const pinHash = await bcrypt.hash(pin, 12);
    await db.user.update({ where: { id: childUser.id }, data: { pinHash } });

    if (nickname || animalCompanion) {
      await db.childProfile.update({ where: { childId }, data: { ...(nickname && { nickname }), ...(animalCompanion && { animalCompanion }) } });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await auditLog({ userId: user.id, action: "CHILD_PIN_SET", entityType: "child", entityId: childId, ipAddress: ip, success: true });

    return NextResponse.json({ ok: true, pin });
  } catch (err) {
    logger.error("Set child PIN error", { err });
    return NextResponse.json({ ok: false, error: "Failed to set PIN" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) return NextResponse.json({ ok: false, error: "childId required" }, { status: 400 });

  const childProfile = await db.childProfile.findFirst({ where: { childId } });
  if (!childProfile) return NextResponse.json({ ok: true, hasPin: false, profile: null });

  const childUser = await db.user.findUnique({ where: { id: childProfile.userId } });
  return NextResponse.json({ ok: true, hasPin: !!childUser?.pinHash, profile: { nickname: childProfile.nickname, animalCompanion: childProfile.animalCompanion, theme: childProfile.theme } });
}
