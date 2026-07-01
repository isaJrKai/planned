import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.platformRole !== "FOUNDER") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { twoFactorEnabled: true, twoFactorEnrolledAt: true, twoFactorBackupCodesHash: true },
  });
  let backupCodesRemaining = 0;
  if (dbUser?.twoFactorBackupCodesHash) {
    try { backupCodesRemaining = JSON.parse(dbUser.twoFactorBackupCodesHash).length; } catch { backupCodesRemaining = 0; }
  }
  return NextResponse.json({
    ok: true,
    enabled: dbUser?.twoFactorEnabled ?? false,
    enrolledAt: dbUser?.twoFactorEnrolledAt ?? null,
    backupCodesRemaining,
  });
}
