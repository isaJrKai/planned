"use client";
import * as React from "react";
import { formatMoney, parseMoneyInput } from "@/lib/money";
import { weeksToReach } from "@/lib/goals";

/** Deterministic what-if. Pure arithmetic, no model. */
export function WhatIf({ remaining, currency, currentWeekly }: { remaining: number; currency: string; currentWeekly: number }) {
  const [v, setV] = React.useState(String(Math.max(currentWeekly, 1000)));
  const weekly = parseMoneyInput(v, currency) ?? 0;
  const w = weeksToReach(remaining, weekly);
  const date = w ? new Date(Date.now() + w * 7 * 86400000) : null;
  return (
    <div className="border border-line rounded-lg p-4 bg-warm">
      <p className="text-[13px] font-medium text-ink-3 uppercase tracking-wide">What if</p>
      <label className="block mt-2 text-[14.5px]">Save <span className="inline-flex items-center border border-line-strong rounded-md bg-paper h-8 px-2 mx-1 align-middle"><span className="text-[12px] text-ink-3 mr-1">{currency}</span><input value={v} onChange={(e) => setV(e.target.value)} inputMode="numeric" className="w-24 bg-transparent outline-none tnum text-[14.5px]" aria-label="Weekly amount" /></span> every week</label>
      <p className="mt-3 text-[15px]">{remaining <= 0 ? "This goal is already reached." : w ? <>Reached in <strong>{w} {w === 1 ? "week" : "weeks"}</strong> — around <strong>{date!.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</strong>.</> : "Enter an amount to see a date."}</p>
      {weekly > 0 && remaining > 0 && <p className="text-[13.5px] text-ink-3 mt-1">Adding {formatMoney(Math.round(weekly * 0.25), currency)} more each week would make it {weeksToReach(remaining, Math.round(weekly * 1.25))} weeks.</p>}
    </div>
  );
}
