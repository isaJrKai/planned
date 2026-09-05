import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { handler, ok, parseBody, rateLimit, clientIp } from "@/lib/api";
import { randomToken, sha256 } from "@/lib/crypto";
import { audit } from "@/lib/audit";

export const POST = handler(async (req) => {
  rateLimit(`forgot:${clientIp(req)}`, 5, 15 * 60 * 1000);
  const { email } = await parseBody(req, z.object({ email: z.string().trim().email() }));
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  let devLink: string | undefined;
  if (user) {
    const token = randomToken(32);
    await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 30 * 60 * 1000) });
    await audit({ actorUserId: user.id, action: "auth.reset_requested" }, req);
    const link = `${new URL(req.url).origin}/reset-password?token=${token}`;
    // No email provider is wired in this environment; surface the link server-side.
    console.log(`[planned] password reset link for ${email}: ${link}`);
    if (process.env.NODE_ENV !== "production" || process.env.SHOW_RESET_LINKS === "1") devLink = link;
  }
  return ok({ message: "If an account exists for that email, we've sent a reset link. It expires in 30 minutes.", devLink });
});
