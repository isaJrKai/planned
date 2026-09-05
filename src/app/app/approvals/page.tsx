import { ListChecks } from "lucide-react";
import { desc, eq, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { approvalRequests } from "@/db/schema";
import { requireParent } from "@/lib/auth";
import { listPendingApprovals, listMembers } from "@/lib/family";
import { PageHeader } from "@/components/app/Shell";
import { ApprovalActions } from "@/components/app/Actions";
import { Money, EmptyState, Pill, SectionTitle } from "@/components/ui";
import { relDate } from "@/lib/format";

export const metadata = { title: "Approvals" };
const TYPE: Record<string, string> = { money_request: "asked for", goal_withdrawal: "wants to take", purchase: "wants to spend" };

export default async function Approvals() {
  const v = await requireParent();
  const [pending, members, recent] = await Promise.all([listPendingApprovals(v.family.id), listMembers(v.family.id), db.select().from(approvalRequests).where(and(eq(approvalRequests.familyId, v.family.id), ne(approvalRequests.status, "pending"))).orderBy(desc(approvalRequests.resolvedAt)).limit(10)]);
  const nameOf = (id: string) => members.find((m) => m.member.id === id)?.user.displayName ?? "Someone";
  const c = v.family.currency;
  return (
    <div className="rise">
      <PageHeader title="Needs your attention" sub="Money requests, big purchases and goal withdrawals. Approving moves the money; declining just tells them." />
      {pending.length === 0 ? (
        <EmptyState icon={<ListChecks className="h-5 w-5" />} title="Nothing needs your attention" body="When a child asks for money or tries something that needs approval, it'll appear here." />
      ) : (
        <ul className="space-y-4">
          {pending.map((r) => (
            <li key={r.id} className="border border-line rounded-lg p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[17px] font-medium">{nameOf(r.memberId)} {TYPE[r.type]} <Money amount={r.amount} currency={c} /></p>
                <span className="text-[13px] text-ink-3">{relDate(r.createdAt)}</span>
              </div>
              <p className="text-[15px] text-ink-2 mt-1">{r.type === "goal_withdrawal" ? "From a goal · " : ""}{r.reason}</p>
              <div className="mt-4"><ApprovalActions id={r.id} /></div>
            </li>
          ))}
        </ul>
      )}
      {recent.length > 0 && (
        <section className="mt-14">
          <SectionTitle title="Recently decided" />
          <ul className="divide-y divide-line">
            {recent.map((r) => <li key={r.id} className="py-3 flex items-center justify-between gap-3 text-[14.5px]"><span>{nameOf(r.memberId)} · {r.reason} · <Money amount={r.amount} currency={c} compact /></span><Pill tone={r.status === "approved" ? "save" : "neutral"}>{r.status}</Pill></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
