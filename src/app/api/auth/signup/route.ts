import { z } from "zod";
import { handler, ok, parseBody, rateLimit, clientIp } from "@/lib/api";
import { createFamilyWithParent } from "@/lib/family";
import { createSession } from "@/lib/auth";
import { audit } from "@/lib/audit";

const schema = z.object({
  familyName: z.string().trim().min(2, "Give your family a name.").max(60),
  parentName: z.string().trim().min(2, "Tell us your name.").max(60),
  email: z.string().trim().email("That email doesn't look right."),
  password: z.string().min(10, "Use at least 10 characters.").max(200),
  currency: z.enum(["UGX", "KES", "TZS", "RWF", "USD", "EUR", "GBP"]).default("UGX"),
});

export const POST = handler(async (req) => {
  rateLimit(`signup:${clientIp(req)}`, 5, 60 * 60 * 1000);
  const body = await parseBody(req, schema);
  const { user, family } = await createFamilyWithParent(body);
  await createSession(user.id, { ip: clientIp(req), userAgent: req.headers.get("user-agent") });
  await audit({ familyId: family.id, actorUserId: user.id, action: "auth.signup", targetType: "user", targetId: user.id }, req);
  return ok({ redirect: "/app" }, { status: 201 });
});
