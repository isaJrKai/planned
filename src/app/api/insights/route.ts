import { handler, ok } from "@/lib/api";
import { requireViewer } from "@/lib/auth";
import { familyPulse, whatsHappening, nextMoves } from "@/lib/insights";

export const GET = handler(async () => {
  const v = await requireViewer();
  const [pulse, happening, moves] = await Promise.all([
    familyPulse(v.family.id),
    whatsHappening(v.family.id),
    nextMoves(v.family.id),
  ]);
  return ok({ pulse, happening, moves });
});
