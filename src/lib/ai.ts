import { eq } from "drizzle-orm";
import { db } from "@/db";
import { familySettings } from "@/db/schema";
import { decryptSecret } from "./crypto";

/**
 * The embedded coach. It only ever *interprets* numbers the backend already computed.
 * It never performs actions. If no provider is configured or the call fails, callers
 * fall back to deterministic text, so the product never depends on the model.
 */
export type AiConfig = { enabled: boolean; baseUrl: string; model: string; apiKey: string | null; source: "family" | "environment" | "none" };

export async function resolveAiConfig(familyId: string): Promise<AiConfig> {
  const [s] = await db.select().from(familySettings).where(eq(familySettings.familyId, familyId)).limit(1);
  const famKey = s?.aiApiKeyEncrypted ? decryptSecret(s.aiApiKeyEncrypted) : null;
  const envKey = process.env.AI_API_KEY ?? null;
  const apiKey = famKey ?? envKey;
  return {
    enabled: s?.aiEnabled ?? true,
    baseUrl: (s?.aiBaseUrl || process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
    model: s?.aiModel || process.env.AI_MODEL || "gpt-4o-mini",
    apiKey,
    source: famKey ? "family" : envKey ? "environment" : "none",
  };
}

const SYSTEM = `You are the quiet financial coach inside Planned, a family money app. You explain numbers the app has already calculated. Rules:
- Be warm, plain and brief (2–4 sentences). No emojis. No exclamation marks. Never call yourself an AI or assistant.
- Only reference figures provided in the context. Never invent numbers, dates or events.
- Never instruct anyone to move money, and never claim you did. You may suggest a conversation or a small next step a parent could take in the app.
- If the audience is a child, use simpler words and encouragement without being childish.`;

export async function interpret(familyId: string, question: string, context: Record<string, unknown>, audience: "parent" | "child"): Promise<{ text: string; source: "model" | "fallback" }> {
  const cfg = await resolveAiConfig(familyId);
  const fallback = deterministicFallback(question, context);
  if (!cfg.enabled || !cfg.apiKey) return { text: fallback, source: "fallback" };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.4,
        max_tokens: 220,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Audience: ${audience}\nContext (JSON, authoritative): ${JSON.stringify(context)}\n\nQuestion: ${question}` },
        ],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return { text: fallback, source: "fallback" };
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return { text: fallback, source: "fallback" };
    return { text, source: "model" };
  } catch {
    return { text: fallback, source: "fallback" };
  }
}

/** Rule-based prose for when no provider is configured. Written to read like a person, not a data dump. */
function deterministicFallback(question: string, ctx: Record<string, unknown>): string {
  const n = (k: string) => (typeof ctx[k] === "number" ? (ctx[k] as number) : null);
  const cur = typeof ctx.currency === "string" ? (ctx.currency as string) : "";
  const fmt = (v: number) => `${cur} ${v.toLocaleString()}`.trim();
  const saved = n("savedThisMonth"), savedPrev = n("savedLastMonth"), spent = n("spentThisMonth"), spentPrev = n("spentLastMonth"), total = n("totalSavings"), goals = n("activeGoals");
  const s: string[] = [];
  if (saved !== null) {
    if (saved === 0) s.push("Nothing has been saved yet this month, which usually just means the month is young or an allowance hasn't landed.");
    else if (savedPrev && savedPrev > 0) {
      const d = Math.round(((saved - savedPrev) / savedPrev) * 100);
      s.push(d >= 0 ? `The family has put away ${fmt(saved)} so far this month, ${d}% more than at this point last month.` : `The family has put away ${fmt(saved)} this month, ${Math.abs(d)}% less than last month — worth asking what changed rather than worrying.`);
    } else s.push(`The family has put away ${fmt(saved)} so far this month.`);
  }
  if (spent !== null && spent > 0) {
    if (spentPrev && spent > spentPrev * 1.25) s.push(`Spending is noticeably up at ${fmt(spent)}, compared with ${fmt(spentPrev)} last month.`);
    else s.push(`Spending sits at ${fmt(spent)}, which looks in proportion.`);
  }
  if (total !== null && total > 0) s.push(`Altogether there is ${fmt(total)} in savings and goals${goals ? `, across ${goals} active ${goals === 1 ? "goal" : "goals"}` : ""}.`);
  if (typeof ctx.childrenSavingThisMonth === "string") s.push(`${ctx.childrenSavingThisMonth} children have saved something this month.`);
  const closing = /talk|conversation|discuss/i.test(question)
    ? "A good conversation starter: ask each child what they chose not to buy this month, and how that felt."
    : "Small, regular amounts matter more than big one-offs — that is what these numbers reward.";
  s.push(closing);
  return s.join(" ");
}
