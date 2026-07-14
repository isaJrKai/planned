"use client";

// ============================================================================
// PERSISTED MUTATIONS — components call these instead of raw store methods
// ============================================================================
// Each function:
//   1. Calls the local Zustand mutation (optimistic update — UI updates instantly)
//   2. Fires persistMutation() to POST to /api/mutations
//   3. On success, the server returns fresh state and the store is re-hydrated
//   4. On failure, the store is rolled back to the server's last-known state
//
// Import from here instead of from ./store for any mutation that should
// persist to the database.
// ============================================================================

import { useStore } from "./store";
import { persistMutation } from "./store-hydration";
import { TOKEN_REDEEM_RATE } from "./phrases";
import type { Goal, Investment, Transaction, TxType } from "./types";

// ---- Transactions ----------------------------------------------------------

export function addTransaction(tx: Omit<Transaction, "id" | "timestamp"> & { timestamp?: number }) {
  // Optimistic local update
  useStore.getState().addTransaction(tx);
  // Persist to DB
  persistMutation("addTransaction", tx).catch(() => {});
}

export function addSpendingEntry(e: {
  ownerId: string;
  ownerKind: "parent" | "child";
  ownerName: string;
  category: string;
  amount: number;
  note: string;
  timestamp?: number;
}) {
  useStore.getState().addSpendingEntry(e);
  persistMutation("addSpendingEntry", e).catch(() => {});
}

export function giveTokens(childId: string, tokens: number, note: string) {
  useStore.getState().giveTokens(childId, tokens, note);
  persistMutation("giveTokens", { childId, tokens, note }).catch(() => {});
}

export function redeemTokens(childId: string, tokens: number): boolean {
  const state = useStore.getState();
  const balance = state.tokenLedger
    .filter((t) => t.childId === childId && t.type === "parent_give")
    .reduce((s, t) => s + t.tokens, 0) -
    state.tokenLedger
      .filter((t) => t.childId === childId && t.type === "redeem")
      .reduce((s, t) => s + t.tokens, 0);
  if (tokens > balance) return false;

  const cashValue = tokens * TOKEN_REDEEM_RATE;
  state.redeemTokens(childId, tokens);
  persistMutation("redeemTokens", { childId, tokens, cashValue }).catch(() => {});
  return true;
}

export function investNow(
  childId: string,
  amount: number,
  name: string,
  type: Investment["type"]
): boolean {
  const state = useStore.getState();
  const child = state.children.find((c) => c.id === childId);
  if (!child || amount > child.currentAmount) return false;

  state.investNow(childId, amount, name, type);
  persistMutation("investNow", { childId, amount, name, type }).catch(() => {});
  return true;
}

// ---- Goals -----------------------------------------------------------------

export function addGoal(goal: Omit<Goal, "id" | "createdAt" | "periodStart">): { ok: boolean; error?: string } {
  const result = useStore.getState().addGoal(goal);
  if (!result.ok) return result;
  persistMutation("createGoal", goal).catch(() => {});
  return { ok: true };
}

export function updateGoal(id: string, patch: Partial<Goal>) {
  useStore.getState().updateGoal(id, patch);
  persistMutation("updateGoal", { id, patch }).catch(() => {});
}

export function deleteGoal(id: string) {
  useStore.getState().deleteGoal(id);
  persistMutation("deleteGoal", { id }).catch(() => {});
}

export function contributeToGoal(id: string, amount: number) {
  useStore.getState().contributeToGoal(id, amount);
  persistMutation("contributeToGoal", { id, amount }).catch(() => {});
}

// ---- Family settings -------------------------------------------------------

export function setAnnualTheme(theme: string) {
  useStore.getState().setAnnualTheme(theme);
  persistMutation("setFamilySettings", { annualTheme: theme }).catch(() => {});
}

export function setMonthlyQuote(quote: string) {
  useStore.getState().setMonthlyQuote(quote);
  persistMutation("setFamilySettings", { monthlyQuote: quote }).catch(() => {});
}

// ---- Profile photos + names ------------------------------------------------

export function setParentPhoto(parentId: string, photo: string) {
  useStore.getState().setParentPhoto(parentId, photo);
  persistMutation("setParentPhoto", { parentId, photo }).catch(() => {});
}

export function setParentName(parentId: string, name: string) {
  useStore.getState().setParentName(parentId, name);
  persistMutation("setParentName", { parentId, name }).catch(() => {});
}

export function setChildPhoto(childId: string, photo: string) {
  useStore.getState().setChildPhoto(childId, photo);
  persistMutation("setChildPhoto", { childId, photo }).catch(() => {});
}

export function setChildName(childId: string, name: string) {
  useStore.getState().setChildName(childId, name);
  persistMutation("setChildName", { childId, name }).catch(() => {});
}


export function createChild(child: { name: string; age: number; goalName: string; goalAmount: number; avatarColor?: string }) {
  persistMutation("createChild", child).catch(() => {});
}

export function createParent(parent: { name: string; role: string; avatarColor?: string }) {
  persistMutation("createParent", parent).catch(() => {});
}
