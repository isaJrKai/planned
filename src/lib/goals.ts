import type { Transaction } from "@/db/schema";

export type Forecast = {
  weeklyRate: number;
  weeksRemaining: number | null;
  estimatedDate: Date | null;
  weeksObserved: number;
  consistentWeeks: number;
};

/** Deterministic forecast from contribution history. No model involved. */
export function forecastGoal(target: number, saved: number, contributions: Pick<Transaction, "amount" | "createdAt" | "kind">[], now = new Date()): Forecast {
  const remaining = Math.max(0, target - saved);
  const inflows = contributions.filter((c) => c.kind === "goal_contribution");
  if (!inflows.length) return { weeklyRate: 0, weeksRemaining: null, estimatedDate: null, weeksObserved: 0, consistentWeeks: 0 };
  const first = inflows.reduce((m, c) => (c.createdAt < m ? c.createdAt : m), inflows[0].createdAt);
  const weeksObserved = Math.max(1, (now.getTime() - first.getTime()) / (7 * 86400000));
  const total = inflows.reduce((s, c) => s + c.amount, 0);
  const weeklyRate = Math.round(total / weeksObserved);
  // consecutive weeks (ending now) with at least one contribution
  let consistentWeeks = 0;
  for (let w = 0; w < 52; w++) {
    const start = now.getTime() - (w + 1) * 7 * 86400000;
    const end = now.getTime() - w * 7 * 86400000;
    if (inflows.some((c) => c.createdAt.getTime() >= start && c.createdAt.getTime() < end)) consistentWeeks++;
    else break;
  }
  if (remaining === 0) return { weeklyRate, weeksRemaining: 0, estimatedDate: now, weeksObserved: Math.round(weeksObserved), consistentWeeks };
  if (weeklyRate <= 0) return { weeklyRate, weeksRemaining: null, estimatedDate: null, weeksObserved: Math.round(weeksObserved), consistentWeeks };
  const weeksRemaining = Math.ceil(remaining / weeklyRate);
  return { weeklyRate, weeksRemaining, estimatedDate: new Date(now.getTime() + weeksRemaining * 7 * 86400000), weeksObserved: Math.round(weeksObserved), consistentWeeks };
}

/** "What if" — deterministic projection. */
export function projectSavings(weekly: number, weeks: number, annualRatePct = 0) {
  let total = 0;
  const weeklyRate = annualRatePct / 100 / 52;
  for (let i = 0; i < weeks; i++) total = (total + weekly) * (1 + weeklyRate);
  return Math.round(total);
}

export function weeksToReach(remaining: number, weekly: number) {
  if (weekly <= 0) return null;
  return Math.ceil(remaining / weekly);
}
