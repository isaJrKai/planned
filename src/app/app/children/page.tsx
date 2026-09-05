import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { requireParent } from "@/lib/auth";
import { listMembers, listAccounts, listGoals } from "@/lib/family";
import { PageHeader } from "@/components/app/Shell";
import { AddChildButton } from "@/components/app/Actions";
import { Money, EmptyState } from "@/components/ui";

export const metadata = { title: "Children" };

export default async function Children() {
  const v = await requireParent();
  const [members, accounts, goals] = await Promise.all([listMembers(v.family.id), listAccounts(v.family.id), listGoals(v.family.id)]);
  const kids = members.filter((m) => m.member.role === "child");
  const c = v.family.currency;
  return (
    <div className="rise">
      <PageHeader title="Children" sub="Each child has their own sign-in, spending account and savings account." action={kids.length ? <AddChildButton /> : undefined} />
      {kids.length === 0 ? (
        <EmptyState icon={<Users className="h-5 w-5" />} title="Your family starts here" body="Add a child to give them their own accounts and login. You'll be able to set an allowance and rules right after." action={<AddChildButton first />} />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {kids.map((k) => {
            const accts = accounts.filter((a) => a.memberId === k.member.id);
            const spending = accts.find((a) => a.kind === "spending")?.balance ?? 0;
            const savings = accts.find((a) => a.kind === "savings")?.balance ?? 0;
            const goalTotal = accts.filter((a) => a.kind === "goal").reduce((s, a) => s + a.balance, 0);
            const active = goals.filter((g) => g.memberId === k.member.id && g.status === "active").length;
            const age = k.member.birthYear ? new Date().getFullYear() - k.member.birthYear : null;
            return (
              <li key={k.member.id}>
                <Link href={`/app/children/${k.member.id}`} className="flex items-center gap-4 py-4 hover:bg-warm -mx-3 px-3 rounded-md">
                  <div className="h-11 w-11 rounded-full bg-brand-soft text-brand grid place-items-center font-semibold text-[16px]">{k.user.displayName[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[16px]">{k.user.displayName}{age ? <span className="text-ink-3 font-normal"> · {age}</span> : null}</p>
                    <p className="text-[13.5px] text-ink-3">@{k.user.username} · {active} active {active === 1 ? "goal" : "goals"}</p>
                  </div>
                  <dl className="hidden sm:grid grid-cols-3 gap-6 text-right text-[14px]">
                    <div><dt className="text-ink-3 text-[12.5px]">Spending</dt><dd className="tnum font-medium"><Money amount={spending} currency={c} compact /></dd></div>
                    <div><dt className="text-ink-3 text-[12.5px]">Savings</dt><dd className="tnum font-medium text-save"><Money amount={savings + goalTotal} currency={c} compact /></dd></div>
                  </dl>
                  <ArrowRight className="h-4 w-4 text-ink-3" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
