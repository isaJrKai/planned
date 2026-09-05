import { z } from "zod";
import { db } from "@/db";
import { familySettings } from "@/db/schema";
import { handler, ok, parseBody } from "@/lib/api";
import { requireParent } from "@/lib/auth";
import { encryptSecret, maskKey } from "@/lib/crypto";
import { resolveAiConfig } from "@/lib/ai";
import { audit } from "@/lib/audit";

export const GET = handler(async () => {
  const v = await requireParent();
  const c = await resolveAiConfig(v.family.id);
  return ok({ enabled: c.enabled, baseUrl: c.baseUrl, model: c.model, keyMasked: c.apiKey ? maskKey(c.apiKey) : null, source: c.source });
});

export const PATCH = handler(async (req) => {
  const v = await requireParent();
  const body = await parseBody(req, z.object({ enabled: z.boolean().optional(), baseUrl: z.string().url().max(200).nullable().optional(), model: z.string().trim().max(80).nullable().optional(), apiKey: z.string().trim().max(300).nullable().optional() }));
  const set: Partial<typeof familySettings.$inferInsert> = { updatedAt: new Date() };
  if (body.enabled !== undefined) set.aiEnabled = body.enabled;
  if (body.baseUrl !== undefined) set.aiBaseUrl = body.baseUrl;
  if (body.model !== undefined) set.aiModel = body.model;
  if (body.apiKey !== undefined) set.aiApiKeyEncrypted = body.apiKey ? encryptSecret(body.apiKey) : null;
  await db.insert(familySettings).values({ familyId: v.family.id, ...set }).onConflictDoUpdate({ target: familySettings.familyId, set });
  await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "settings.ai_updated", details: { enabled: body.enabled, model: body.model, keyChanged: body.apiKey !== undefined } }, req);
  const c = await resolveAiConfig(v.family.id);
  return ok({ enabled: c.enabled, baseUrl: c.baseUrl, model: c.model, keyMasked: c.apiKey ? maskKey(c.apiKey) : null, source: c.source });
});
