import { handler, ok } from "@/lib/api";
import { requireParent } from "@/lib/auth";
import { reconcileFamily } from "@/lib/ledger";

export const GET = handler(async () => ok(await reconcileFamily((await requireParent()).family.id)));
