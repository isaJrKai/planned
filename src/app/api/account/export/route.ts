import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { transactions, goals, allowanceRules, approvalRequests, auditLog, lessonCompletions, journalEntries, familyMembers } from "@/db/schema";
import { handler } from "@/lib/api";
import { requireParent } from "@/lib/auth";
import { listMembers, listAccounts } from "@/lib/family";
import { audit } from "@/lib/audit";

export const GET = handler(async (req) => {
  const v = await requireParent();
  const fid = v.family.id;
  const members = await listMembers(fid);
  const memberIds = members.map((m) => m.member.id);
  const data = {
    exportedAt: new Date().toISOString(),
    family: { id: v.family.id, name: v.family.name, currency: v.family.currency, createdAt: v.family.createdAt },
    members: members.map((m) => ({ id: m.member.id, role: m.member.role, name: m.user.displayName, email: m.user.email, username: m.user.username, birthYear: m.member.birthYear })),
    accounts: await listAccounts(fid),
    transactions: await db.select().from(transactions).where(eq(transactions.familyId, fid)),
    goals: await db.select().from(goals).where(eq(goals.familyId, fid)),
    allowances: await db.select().from(allowanceRules).where(eq(allowanceRules.familyId, fid)),
    requests: await db.select().from(approvalRequests).where(eq(approvalRequests.familyId, fid)),
    lessons: memberIds.length ? await db.select().from(lessonCompletions).where(inArray(lessonCompletions.memberId, memberIds)) : [],
    journal: memberIds.length ? await db.select().from(journalEntries).where(inArray(journalEntries.memberId, memberIds)) : [],
    audit: await db.select().from(auditLog).where(eq(auditLog.familyId, fid)),
  };
  await audit({ familyId: fid, actorUserId: v.user.id, action: "account.exported" }, req);
  void familyMembers;
  return new Response(JSON.stringify(data, null, 2), { headers: { "content-type": "application/json", "content-disposition": `attachment; filename="planned-${v.family.name.replace(/\W+/g, "-").toLowerCase()}.json"` } });
});
