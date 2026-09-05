import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { requireParent } from "@/lib/auth";
import { reverseTransaction } from "@/lib/ledger";

export const POST = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const v = await requireParent();
  const { id } = await params;
  const { reason } = await parseBody(req, z.object({ reason: z.string().trim().min(2, "Say why, briefly.").max(200) }));
  return ok(await reverseTransaction(v.family.id, id, v.user.id, reason));
});
