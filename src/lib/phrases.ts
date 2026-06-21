// ============================================================================
// CONSTANTS & PHRASES — Planned Kids Savings & Allowance App
// ============================================================================
//
// Token economics:
//   TOKEN_BUY_RATE    — what the PARENT pays per token (UGX). Lower than redeem.
//   TOKEN_REDEEM_RATE — what the CHILD receives per token when redeeming (UGX).
//
// The 60% spread (50 -> 80) is the parent's "match" / incentive:
// the child earns 60% more than the parent paid in. This is the central
// mechanic that makes saving + good behaviour genuinely rewarding.

export const TOKEN_BUY_RATE = 50;    // UGX per token — parent side
export const TOKEN_REDEEM_RATE = 80; // UGX per token — child side

// ---- Encouragement phrases (shown in child dashboard) ---------------------
//
// Fix for bug #10: previously a module-level counter cycled predictably and
// reset on HMR. Now selection is randomized at call time (see getEncouragement).

export const ENCOURAGEMENT_PHRASES: readonly string[] = [
  "Every shilling you save is a brick in the house of your future.",
  "Discipline today is freedom tomorrow.",
  "The seed you plant now will shade you later.",
  "Wealth is built quietly, one decision at a time.",
  "A wise child stores up; a foolish one scatters.",
  "Patience turns small coins into a fortune.",
  "What you save today buys your dreams tomorrow.",
  "Save first, spend second — that is the order of wealth.",
  "Your future self is watching what you do today.",
  "Small habits, large outcomes.",
] as const;

export function getEncouragement(): string {
  // Random per call — fixes the predictable-cycling bug.
  return ENCOURAGEMENT_PHRASES[Math.floor(Math.random() * ENCOURAGEMENT_PHRASES.length)];
}

// ---- Date helpers (shared — fixes bug #9 duplication) ---------------------

export function startOfMonth(ts: number = Date.now()): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export function endOfMonth(ts: number = Date.now()): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
}

export function isThisMonth(ts: number, now: number = Date.now()): boolean {
  const d1 = new Date(ts);
  const d2 = new Date(now);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

export function formatUGX(n: number): string {
  // Group with commas, no decimals. tabular-nums handles alignment in UI.
  return "UGX " + Math.round(n).toLocaleString("en-US");
}

export function formatUGXPlain(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}
