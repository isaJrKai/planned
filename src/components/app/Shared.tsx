import Link from "next/link";
import { Money, Progress, Pill } from "@/components/ui";
import { pct } from "@/lib/money";
import { relDate, txnLabel, txnTone } from "@/lib/format";
import type { Transaction } from "@/db/schema";

export function GoalRow({ goal, currency, href, owner }: { goal: { id: string; name: string; targetAmount: number; saved: number; status: string; isShared: boolean }; currency: string; href: string; owner?: string }) {
  const p = pct(goal.saved, goal.targetAmount);
  const tone = goal.status === "completed" ? "save" : goal.isShared ? "brand" : p >= 80 ? "save" : "goal";
  return (
    <Link href={href} className="block py-3.5 group">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <p className="text-[15px] font-medium group-hover:underline underline-offset-2 truncate">{owner ? `${owner} · ` : ""}{goal.name}{goal.status === "completed" && <Pill tone="save" className="ml-2">Reached</Pill>}</p>
        <p className="text-[14px] text-ink-2 tnum shrink-0"><Money amount={goal.saved} currency={currency} compact /> <span className="text-ink-4">/</span> <Money amount={goal.targetAmount} currency={currency} compact /></p>
      </div>
      <div className="flex items-center gap-3"><Progress value={p} tone={tone} label={`${goal.name} progress`} /><span className="text-[13px] text-ink-2 tnum w-10 text-right">{p}%</span></div>
    </Link>
  );
}

export function TxnList({ rows, currency, names, accounts, memberNames, action }: { rows: Transaction[]; currency: string; names?: boolean; accounts: Record<string, { name: string; kind: string; memberId: string | null }>; memberNames: Record<string, string>; action?: (t: Transaction) => React.ReactNode }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((t) => {
        const from = t.fromAccountId ? accounts[t.fromAccountId]?.name ?? "Closed account" : null;
        const to = t.toAccountId ? accounts[t.toAccountId]?.name ?? "Closed account" : null;
        const tone = txnTone(t.kind);
        const outgoing = t.kind === "spend";
        return (
          <li key={t.id} className="py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[15px] font-medium truncate">{t.description}</p>
                <Pill tone={tone}>{txnLabel(t.kind)}</Pill>
                {t.status === "reversed" && <Pill tone="neutral">Reversed</Pill>}
                {t.category && <span className="text-[12.5px] text-ink-3">{t.category}</span>}
              </div>
              <p className="text-[13px] text-ink-3 mt-0.5 truncate">
                {names && t.memberId && memberNames[t.memberId] ? `${memberNames[t.memberId]} · ` : ""}
                {from && to ? `${from} → ${to}` : from ? `From ${from}` : to ? `Into ${to}` : ""} · {relDate(t.createdAt)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-[15px] font-medium tnum ${outgoing ? "text-spend" : tone === "save" ? "text-save" : "text-ink"} ${t.status === "reversed" ? "line-through text-ink-4" : ""}`}><Money amount={outgoing ? -t.amount : t.amount} currency={currency} compact signed={!outgoing} /></p>
              {action && t.status === "posted" && t.kind !== "reversal" && <div className="mt-0.5">{action(t)}</div>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
