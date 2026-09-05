import { requireViewer } from "@/lib/auth";
import { listGoals } from "@/lib/family";
import { PageHeader } from "@/components/app/Shell";
import { GoalButton } from "@/components/app/Actions";
import { GoalRow } from "@/components/app/Shared";
import { SectionTitle } from "@/components/ui";

export const metadata = { title: "My goals" };
export default async function MyGoals() {
  const v = await requireViewer();
  const goals = await listGoals(v.family.id, v.member.id);
  const c = v.family.currency;
  const simple = [{ id: v.member.id, name: v.user.displayName, role: "child" }];
  const active = goals.filter((g) => g.status === "active"); const done = goals.filter((g) => g.status === "completed");
  return (
    <div className="rise">
      <PageHeader title="My goals" sub="Things you're saving for." action={<GoalButton childMode currency={c} members={simple} forMemberId={v.member.id} />} />
      {goals.length === 0 ? (
        <div className="border border-line rounded-lg p-8 bg-warm max-w-lg"><h2 className="text-[20px] font-semibold">Your first goal starts here.</h2><p className="text-ink-2 mt-1">Pick something real. A bicycle, a book, a gift for someone. Then we&rsquo;ll work out how long it takes.</p><div className="mt-4"><GoalButton first childMode currency={c} members={simple} forMemberId={v.member.id} /></div></div>
      ) : (
        <>
          <section><SectionTitle title="Saving for" /><div className="divide-y divide-line">{active.map((g) => <GoalRow key={g.id} goal={g} currency={c} href={`/me/goals/${g.id}`} />)}{!active.length && <p className="text-ink-3 text-[14.5px] py-3">Nothing active. Start a new one?</p>}</div></section>
          {done.length > 0 && <section className="mt-12"><SectionTitle title="Reached" sub="You did these." /><div className="divide-y divide-line">{done.map((g) => <GoalRow key={g.id} goal={g} currency={c} href={`/me/goals/${g.id}`} />)}</div></section>}
        </>
      )}
    </div>
  );
}
