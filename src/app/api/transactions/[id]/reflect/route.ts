import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { handler, ok, parseBody, errors } from "@/lib/api";
import { requireViewer, assertCanActOn } from "@/lib/auth";

export const POST = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const v = await requireViewer();
  const { id } = await params;
  const { worthIt } = await parseBody(req, z.object({ worthIt: z.enum(["yes", "no", "unsure"]) }));
  const [t] = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.familyId, v.family.id))).limit(1);
  if (!t || t.kind !== "spend" || !t.memberId) throw errors.notFound("That purchase");
  assertCanActOn(v, t.memberId);
  await db.update(transactions).set({ metadata: sql`coalesce(${transactions.metadata}, '{}'::jsonb) || ${JSON.stringify({ worthIt })}::jsonb` }).where(eq(transactions.id, id));
  return ok({ worthIt });
});
