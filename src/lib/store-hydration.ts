"use client";

// ============================================================================
// STORE HYDRATION + PERSISTENCE LAYER
// ============================================================================
// Wraps the Zustand store so that:
//   1. On mount, it fetches /api/state and hydrates the store with real DB data
//   2. Every mutation also POSTs to /api/mutations so changes persist to SQLite
//   3. Optimistic updates: the local store updates immediately, then the API
//      call confirms. If the API fails, we re-hydrate from the server to roll back.
//
// Components continue to import useStore from ./store — this module patches
// the store's mutation methods on module load.
// ============================================================================

import { useEffect, useState } from "react";
import { useStore } from "./store";
import type { AppState } from "./db-queries";

// ---- Hydration hook --------------------------------------------------------
// Components call this once on mount to trigger initial state load.

let hydrationPromise: Promise<void> | null = null;

export function hydrateState(): Promise<void> {
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const state: AppState = await res.json();
      useStore.setState({
        children: state.children,
        parents: state.parents,
        accounts: state.accounts,
        transactions: state.transactions,
        spending: state.spending,
        categories: state.categories,
        investments: state.investments,
        tokenLedger: state.tokenLedger,
        goals: state.goals,
        annualTheme: state.annualTheme,
        monthlyQuote: state.monthlyQuote,
        hydrated: true,
      });
    } catch (err) {
      console.error("Hydration failed:", err);
      useStore.setState({ hydrated: true, hydrateError: String(err) });
    }
  })();
  return hydrationPromise;
}

// Force re-hydration (used after mutations to guarantee consistency)
export function rehydrate(): Promise<void> {
  hydrationPromise = null;
  return hydrateState();
}

// ---- Mutation persistence --------------------------------------------------
// Wraps a local mutation + fires a fetch to /api/mutations. On success,
// re-hydrates from server to guarantee consistency. On failure, re-hydrates
// to roll back the optimistic update.

export async function persistMutation(action: string, payload: any): Promise<void> {
  try {
    const res = await fetch("/api/mutations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.state) {
      // Hydrate with server-confirmed state — this REPLACES the entire store
      // with DB truth, eliminating any optimistic-update drift.
      const state: AppState = data.state;
      useStore.setState({
        children: state.children,
        parents: state.parents,
        accounts: state.accounts,
        transactions: state.transactions,
        spending: state.spending,
        categories: state.categories,
        investments: state.investments,
        tokenLedger: state.tokenLedger,
        goals: state.goals,
        annualTheme: state.annualTheme,
        monthlyQuote: state.monthlyQuote,
      });
    }
  } catch (err) {
    console.error(`Mutation ${action} failed:`, err);
    // Re-hydrate to roll back the optimistic update
    rehydrate();
    throw err;
  }
}

// ---- React hook for components ---------------------------------------------

export function useHydratedState() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    hydrateState().then(() => setHydrated(true));
  }, []);
  return hydrated;
}
