// ============================================================================
// TYPES — Planned Kids Savings & Allowance App
// ============================================================================

export type TxType =
  | "save"           // child moves money INTO savings from linked account
  | "withdraw"       // child moves money OUT of savings
  | "invest"         // child invests from savings
  | "redeem"         // child redeems tokens for cash (credit to savings)
  | "parent_give";   // parent awards tokens to child (no cash moves)

export interface Transaction {
  id: string;
  childId: string;
  type: TxType;
  amount: number;       // cash amount in UGX (always positive — direction implied by type)
  tokenDelta: number;   // tokens moved (for parent_give / redeem)
  accountId?: string;   // linked external account (for save / withdraw)
  investmentId?: string;
  note: string;
  timestamp: number;
}

export interface Account {
  id: string;
  childId: string;
  name: string;          // e.g. "Stanbic Junior"
  balance: number;       // external balance in UGX
}

export interface SpendingEntry {
  id: string;
  childId: string;
  category: string;      // matches SpendingCategory.name
  amount: number;
  note: string;
  timestamp: number;
}

export interface SpendingCategory {
  id: string;
  name: string;
  budget: number;        // monthly budget UGX
  // NOTE: `spent` is NOT stored per-category — it is computed per-child.
  // (Fixes bug #7: previously a shared static `spent` field.)
}

export interface Investment {
  id: string;
  childId: string;
  name: string;
  type: "Equity" | "Bond" | "Savings Bond" | "Treasury Bill" | "Unit Trust";
  amountInvested: number;     // original principal in UGX
  currentValue: number;       // mark-to-market value in UGX
  status: "active" | "closed";
  openedAt: number;
}

export interface TokenLedgerEntry {
  id: string;
  childId: string;
  type: "parent_give" | "redeem";
  tokens: number;        // always positive
  note: string;
  timestamp: number;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  avatarColor: string;   // hex used for the halo glow
  currentAmount: number; // live savings balance UGX (Fixes bug #1 — kept in sync)
  goalAmount: number;
  goalName: string;
}
