import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, disable2FA } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";
    const result = await disable2FA({
      userId: user.id,
      currentPassword: body.currentPassword ?? "",
      totpCode: (body.totpCode ?? "").toString().trim(),
      ipAddress: ip, userAgent: ua,
    });
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    logger.error("2FA disable error", { err });
    return NextResponse.json({ ok: false, error: "Failed to disable 2FA" }, { status: 500 });
  }
}
