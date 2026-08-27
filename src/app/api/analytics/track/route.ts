// POST /api/analytics/track — record an analytics event
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const trackSchema = z.object({
  event: z.string().min(1).max(100),
  properties: z.record(z.string(), z.any()).optional(),
  childId: z.string().optional(),
  familyId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = trackSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") ?? "";
    const ua = req.headers.get("user-agent") ?? "";
    const props = input.properties ? JSON.stringify(input.properties) : null;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Use tagged template raw SQL (safer parameter binding)
    try {
      await db.$executeRaw`INSERT INTO AnalyticsEvent (id, familyId, userId, childId, event, properties, ipAddress, userAgent, createdAt) VALUES (${id}, ${input.familyId ?? null}, NULL, ${input.childId ?? null}, ${input.event}, ${props}, ${ip}, ${ua}, ${now})`;
    } catch {
      // Silent fail — analytics should never break the app
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
