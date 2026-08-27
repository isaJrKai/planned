// @ts-nocheck — dead code
// GET /api/feature-flags — list all flags (any authenticated user)
// PATCH /api/feature-flags — toggle a flag (SUPER_ADMIN only)
// ============================================================================
// Defense in depth: middleware already protects /api/feature-flags/* with
// SUPER_ADMIN role check, but we re-verify here in case middleware is
// misconfigured or bypassed. Never trust middleware alone for writes.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, auditLog, SUPER_ADMIN_ROLE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let flags: any[] = [];
    try {
      flags = await db.featureFlag.findMany({ orderBy: { key: "asc" } });
    } catch {
      flags = await db.$queryRaw`SELECT * FROM FeatureFlag ORDER BY key ASC`;
    }
    return NextResponse.json({ flags });
  } catch {
    return NextResponse.json({ flags: [] });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // ---- Defense-in-depth role check (do not rely on middleware alone) ----
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }
    if (user.role !== SUPER_ADMIN_ROLE) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      const ua = req.headers.get("user-agent") ?? "unknown";
      await auditLog({
        userId: user.id,
        action: "FEATURE_FLAG_TOGGLE_FORBIDDEN",
        entityType: "feature_flag",
        entityId: "n/a",
        ipAddress: ip,
        userAgent: ua,
        success: false,
        after: { role: user.role },
      });
      return NextResponse.json(
        { error: "Forbidden: founder-only resource" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { key, enabled } = body;
    if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be boolean" }, { status: 400 });
    }

    try {
      await db.featureFlag.update({ where: { key }, data: { enabled } });
    } catch {
      await db.$executeRaw`UPDATE FeatureFlag SET enabled = ${enabled}, updatedAt = ${new Date().toISOString()} WHERE key = ${key}`;
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";
    await auditLog({
      userId: user.id,
      action: "FEATURE_FLAG_TOGGLED",
      entityType: "feature_flag",
      entityId: key,
      before: { enabled: !enabled },
      after: { enabled },
      ipAddress: ip,
      userAgent: ua,
      success: true,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to toggle flag" }, { status: 500 });
  }
}
