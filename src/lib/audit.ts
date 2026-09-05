import { db } from "@/db";
import { auditLog } from "@/db/schema";
import type { NextRequest } from "next/server";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function audit(
  entry: {
    familyId?: string | null;
    actorUserId?: string | null;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: Record<string, unknown>;
  },
  req?: NextRequest | null,
  tx?: Tx,
) {
  const exec = tx ?? db;
  await exec.insert(auditLog).values({
    familyId: entry.familyId ?? null,
    actorUserId: entry.actorUserId ?? null,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    details: entry.details,
    ip: req ? (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null : null,
    userAgent: req?.headers.get("user-agent")?.slice(0, 300) ?? null,
  });
}
