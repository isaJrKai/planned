import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signSession, setSessionCookie, auditLog } from "@/lib/auth";
import { logger } from "@/lib/logger";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MASCOT_MAP: Record<string, string> = {
  "turtle": "turtle", "rabbit": "rabbit", "chick": "chick", "panda": "panda", "penguin": "penguin", "koala": "koala",
  "fox": "fox", "dolphin": "dolphin", "owl": "owl", "squirrel": "squirrel", "raccoon": "raccoon",
  "eagle": "eagle", "wolf": "wolf", "lion": "lion", "octopus": "octopus", "dragon": "dragon", "leopard": "leopard",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mascot, name, pin } = body;
    if (!mascot || !name || !pin || pin.length !== 4) {
      return NextResponse.json({ ok: false, error: "Pick your mascot, enter your name and secret code." }, { status: 400 });
    }
    const mascotKey = MASCOT_MAP[mascot] || mascot.toLowerCase();
    const profiles = await db.childProfile.findMany();
    const profile = profiles.find(p => p.nickname.toLowerCase() === name.trim().toLowerCase() && p.animalCompanion?.toLowerCase() === mascotKey);
    if (!profile) return NextResponse.json({ ok: false, error: "Hmm, that doesn't match. Check your mascot and name!" }, { status: 401 });
    const user = await db.user.findUnique({ where: { id: profile.userId, deletedAt: null } });
    if (!user || !user.pinHash) return NextResponse.json({ ok: false, error: "Your secret code isn't set up yet. Ask your parent!" }, { status: 400 });
    const pinOk = await bcrypt.compare(pin, user.pinHash);
    if (!pinOk) return NextResponse.json({ ok: false, error: "That's not the right secret code. Try again!" }, { status: 401 });
    const token = await signSession({ sub: user.id, email: user.email ?? profile.nickname, platformRole: user.platformRole, familyRole: "CHILD" });
    await setSessionCookie(token);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await auditLog({ userId: user.id, action: "CHILD_LOGIN_SUCCESS", entityType: "user", entityId: user.id, ipAddress: ip, success: true });
    return NextResponse.json({ ok: true, user: { id: user.id, nickname: profile.nickname, animalCompanion: profile.animalCompanion } });
  } catch (err) {
    logger.error("Child login error", { err });
    return NextResponse.json({ ok: false, error: "Something went wrong. Try again!" }, { status: 500 });
  }
}
