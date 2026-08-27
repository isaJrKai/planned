// app/api/v1/audit/route.ts — public audit log endpoint (now uses Prisma directly)
// ============================================================================
// SECURITY NOTE: This route is now protected by middleware (deny-by-default
// for /api/*). Only authenticated users can access it. Previously it called
// execSync(python3 ...) which was a DoS amplifier and RCE risk if the script
// path ever became parameterized.
// ============================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        userId: true,
        action: true,
        before: true,
        after: true,
        ipAddress: true,
        userAgent: true,
      },
    });

    const formatted = logs.map((e) => {
      let details: any = {};
      try {
        if (e.after) details = JSON.parse(e.after);
        else if (e.before) details = JSON.parse(e.before);
      } catch {
        // ignore parse errors
      }
      return {
        id: String(e.id ?? ""),
        timestamp: e.createdAt?.toISOString() ?? "",
        actor: e.userId ?? "system",
        action: String(e.action ?? "unknown"),
        details,
        ipAddress: String(e.ipAddress ?? ""),
        userAgent: String(e.userAgent ?? ""),
      };
    });

    return NextResponse.json({
      data: { logs: formatted, count: formatted.length },
      meta: { version: "v1", timestamp: new Date().toISOString() },
    });
  } catch (err) {
    console.error("Audit endpoint error:", err);
    return NextResponse.json({
      data: { logs: [], count: 0 },
      meta: { version: "v1", timestamp: new Date().toISOString() },
    });
  }
}
