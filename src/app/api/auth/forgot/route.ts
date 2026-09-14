import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { handler, ok, parseBody, rateLimit, clientIp } from "@/lib/api";
import { randomToken, sha256 } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

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

    // Send the reset email (falls back to console.log if no API key)
    try {
      await sendEmail(
        email,
        "Reset your Planned password",
        `<p>Hi ${user.displayName},</p><p>Someone requested a password reset for your Planned account.</p><p><a href="${link}">Click here to reset your password</a></p><p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p><p>— The Planned team</p>`
      );
    } catch (e) {
      console.error("[email] Failed to send reset email:", e);
    }

    // In dev mode, surface the link directly
    if (process.env.NODE_ENV !== "production" || process.env.SHOW_RESET_LINKS === "1") devLink = link;
  }
  return ok({ message: "If an account exists for that email, we've sent a reset link. It expires in 30 minutes.", devLink });
});
