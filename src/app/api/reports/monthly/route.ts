import { handler, ok } from "@/lib/api";
import { requireParent } from "@/lib/auth";
import { familyPulse } from "@/lib/insights";

export const GET = handler(async () => {
  const v = await requireParent();
  return ok(await familyPulse(v.family.id));
});
