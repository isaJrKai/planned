import { Target } from "lucide-react";
import { requireParent } from "@/lib/auth";
import { listGoals, listMembers } from "@/lib/family";
import { PageHeader } from "@/components/app/Shell";
import { GoalButton } from "@/components/app/Actions";
import { GoalRow } from "@/components/app/Shared";
import { EmptyState, SectionTitle } from "@/components/ui";

export const metadata = { title: "Goals" };

export default async function Goals() {
  const v = await requireParent();
  const [goals, members] = await Promise.all([listGoals(v.family.id), listMembers(v.family.id)]);
  const c = v.family.currency;
  const simple = members.map((m) => ({ id: m.member.id, name: m.user.displayName, role: m.member.role }));
  const nameOf = (id: string | null) => (id ? simple.find((m) => m.id === id)?.name : "Family");
  const active = goals.filter((g) => g.status === "active");
  const done = goals.filter((g) => g.status === "completed");
  const hasKids = simple.some((m) => m.role === "child");
  return (
    <div className="rise">
      <PageHeader title="Goals" sub="Something concrete to save for. Children can create their own; shared goals are for the whole family." action={<GoalButton currency={c} members={simple} allowShared />} />
      {goals.length === 0 ? (
        <EmptyState icon={<Target className="h-5 w-5" />} title="Your family's first goal starts here" body={hasKids ? "Pick something a child is saving for, or start a shared family goal like a holiday fund. Planned will work out when you'll get there." : "Add a child first, or start a shared family goal."} action={<GoalButton first currency={c} members={simple} allowShared />} />
      ) : (
        <>
          <section><SectionTitle title="Active" sub={`${active.length} in progress`} />{active.length ? <div className="divide-y divide-line">{active.map((g) => <GoalRow key={g.id} goal={g} currency={c} href={`/app/goals/${g.id}`} owner={nameOf(g.memberId)} />)}</div> : <p className="text-ink-3 text-[14.5px]">No active goals right now.</p>}</section>
          {done.length > 0 && <section className="mt-12"><SectionTitle title="Reached" sub={`${done.length} completed — worth celebrating`} /><div className="divide-y divide-line">{done.map((g) => <GoalRow key={g.id} goal={g} currency={c} href={`/app/goals/${g.id}`} owner={nameOf(g.memberId)} />)}</div></section>}
        </>
      )}
    </div>
  );
}
