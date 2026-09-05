import { handler, ok } from "@/lib/api";
import { destroySession, getViewer } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const POST = handler(async (req) => {
  const v = await getViewer();
  await destroySession();
  if (v) await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "auth.logout" }, req);
  return ok({ redirect: "/login" });
});
