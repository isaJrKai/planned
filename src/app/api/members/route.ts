import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { requireParent, requireViewer } from "@/lib/auth";
import { addChild, listMembers } from "@/lib/family";

export const GET = handler(async () => {
  const v = await requireViewer();
  const rows = await listMembers(v.family.id);
  return ok(rows.map((r) => ({ id: r.member.id, role: r.member.role, name: r.user.displayName, username: r.user.username, birthYear: r.member.birthYear })));
});

const schema = z.object({
  name: z.string().trim().min(1, "What's their name?").max(40),
  username: z.string().trim().min(3, "At least 3 characters.").max(24).regex(/^[a-z0-9_]+$/i, "Letters, numbers and underscores only."),
  password: z.string().min(6, "At least 6 characters.").max(100),
  birthYear: z.number().int().min(1990).max(new Date().getFullYear()).optional(),
});

export const POST = handler(async (req) => {
  const v = await requireParent();
  const body = await parseBody(req, schema);
  const { member } = await addChild(v.family.id, v.user.id, body);
  return ok({ id: member.id }, { status: 201 });
});
