"use client";

// ============================================================================
// MODALS — Planned Kids Savings
// ============================================================================
// All money-action modals in one file. Each one is editorial-styled and
// contains the specific fix for its corresponding audit bug.
//
// Bugs addressed here:
//   #1, #5 — SaveMoneyModal validates balance AND updates child.currentAmount
//   #6     — InvestmentDetailModal "Invest Now" is honestly disabled
//   #12    — AddSpendingModal surfaces new entries immediately (store handles)
// ============================================================================

import { useEffect, useState } from "react";
import {
  X,
  Check,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  TOKEN_BUY_RATE,
  TOKEN_REDEEM_RATE,
  formatUGX,
  formatUGXPlain,
} from "@/lib/phrases";
import type { Child, Investment } from "@/lib/types";

// ---- Reusable shell --------------------------------------------------------

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-up"
      style={{
        background:
          "radial-gradient(80% 80% at 50% 50%, rgba(9,12,10,0.85) 0%, rgba(9,12,10,0.96) 100%)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="surface-wood-strong rounded-lg w-full max-w-md shadow-2xl"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-foreground/40 hover:text-foreground/80 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="micro-label-gold mb-2">{subtitle ?? "Action"}</div>
          <h2 className="font-editorial text-2xl text-foreground tracking-editorial leading-tight">
            {title}
          </h2>
          <div className="divider-gold mt-5" />
        </div>

        {/* Body */}
        <div className="px-7 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-7 pb-7 pt-3">
            <div className="divider-gold mb-4" />
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Save Money Modal ------------------------------------------------------
// Bug #1 + #5 fix: validates balance AND the store updates child.currentAmount.

export function SaveMoneyModal({
  child,
  onClose,
}: {
  child: Child;
  onClose: () => void;
}) {
  const accounts = useStore((s) => s.accounts);
  const addTransaction = useStore((s) => s.addTransaction);

  const childAccount = accounts.find((a) => a.childId === child.id);
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const amt = Number(amount) || 0;
  const tooMuch = childAccount ? amt > childAccount.balance : false;
  const canSubmit = amt > 0 && !tooMuch;

  const handleSubmit = () => {
    if (!canSubmit || !childAccount) return;
    addTransaction({
      childId: child.id,
      type: "save",
      amount: amt,
      tokenDelta: 0,
      accountId: childAccount.id,
      note: note || "Saved to goal",
    });
    setSubmitted(true);
    setTimeout(onClose, 1100);
  };

  return (
    <ModalShell
      title="Save Money"
      subtitle={`${child.name} · Linked Account`}
      onClose={onClose}
      footer={
        submitted ? (
          <div className="flex items-center gap-3 text-[#6BBF8A]">
            <Check className="h-4 w-4" />
            <span className="micro-label" style={{ color: "#6BBF8A" }}>
              Saved · Balance Updated
            </span>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-ghost flex-1 px-4 py-2.5 rounded text-sm tracking-wide"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-gold flex-1 px-4 py-2.5 rounded text-sm"
            >
              Save {amt > 0 && `· UGX ${formatUGXPlain(amt)}`}
            </button>
          </div>
        )
      }
    >
      {childAccount ? (
        <div className="space-y-5">
          <div className="surface-flat rounded p-4 flex justify-between items-center">
            <div>
              <div className="micro-label mb-1">Linked Account</div>
              <div className="font-editorial text-base text-foreground tracking-wide">
                {childAccount.name}
              </div>
            </div>
            <div className="text-right">
              <div className="micro-label mb-1">Balance</div>
              <div className="font-editorial text-lg text-gold-foil-static tabular-nums">
                {formatUGX(childAccount.balance)}
              </div>
            </div>
          </div>

          <div>
            <label className="micro-label block mb-2">Amount to Save (UGX)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
              className="input-editorial w-full px-4 py-3 font-editorial text-2xl tabular-nums"
            />
            {tooMuch && (
              <div className="mt-2 flex items-center gap-2 text-[#D4943A] text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>
                  Amount exceeds available balance of {formatUGX(childAccount.balance)}.
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="micro-label block mb-2">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Weekly save · Birthday gift"
              className="input-editorial w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div className="divider-gold" />

          <div className="flex justify-between text-xs">
            <span className="micro-label">Current Savings</span>
            <span className="font-editorial tabular-nums text-foreground/80">
              {formatUGX(child.currentAmount)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="micro-label">After This Save</span>
            <span
              className="font-editorial tabular-nums text-gold-foil-static"
              style={{ background: "none", WebkitTextFillColor: "#E8D5A0" }}
            >
              {formatUGX(child.currentAmount + (canSubmit ? amt : 0))}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-foreground/60 py-6 text-center">
          No linked account found for this child.
        </div>
      )}
    </ModalShell>
  );
}

// ---- Give Tokens Modal -----------------------------------------------------

export function GiveTokensModal({
  child,
  onClose,
}: {
  child: Child;
  onClose: () => void;
}) {
  const giveTokens = useStore((s) => s.giveTokens);
  const [tokens, setTokens] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const t = Number(tokens) || 0;
  const canSubmit = t > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    giveTokens(child.id, t, note || "Token award");
    setSubmitted(true);
    setTimeout(onClose, 1100);
  };

  return (
    <ModalShell
      title="Award Tokens"
      subtitle={`${child.name} · Parent Incentive`}
      onClose={onClose}
      footer={
        submitted ? (
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-[#C9A84C]" />
            <span className="micro-label" style={{ color: "#C9A84C" }}>
              Tokens Awarded
            </span>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-ghost flex-1 px-4 py-2.5 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-gold flex-1 px-4 py-2.5 rounded text-sm"
            >
              Award {t > 0 && `· ${t} ◈`}
            </button>
          </div>
        )
      }
    >
      <div className="space-y-5">
        <div className="surface-flat rounded p-4 flex justify-between items-center">
          <div>
            <div className="micro-label mb-1">Token Economics</div>
            <div className="text-xs text-foreground/60 leading-relaxed">
              Parent buys at <span className="text-[#C9A84C]">UGX {TOKEN_BUY_RATE}/token</span>.
              Child redeems at <span className="text-[#E8D5A0]">UGX {TOKEN_REDEEM_RATE}/token</span>.
            </div>
          </div>
        </div>

        <div>
          <label className="micro-label block mb-2">Number of Tokens</label>
          <input
            type="number"
            value={tokens}
            onChange={(e) => setTokens(e.target.value)}
            placeholder="0"
            autoFocus
            className="input-editorial w-full px-4 py-3 font-editorial text-2xl tabular-nums"
          />
        </div>

        <div>
          <label className="micro-label block mb-2">Reason</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Math test A · Chores week"
            className="input-editorial w-full px-4 py-2.5 text-sm"
          />
        </div>

        <div className="divider-gold" />

        <div className="flex justify-between text-xs">
          <span className="micro-label">Parent Cost</span>
          <span className="font-editorial tabular-nums text-foreground/80">
            {formatUGX(t * TOKEN_BUY_RATE)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="micro-label">Child Redeems For</span>
          <span
            className="font-editorial tabular-nums"
            style={{ color: "#E8D5A0" }}
          >
            {formatUGX(t * TOKEN_REDEEM_RATE)}
          </span>
        </div>
      </div>
    </ModalShell>
  );
}

// ---- Add Spending Modal ----------------------------------------------------
// Bug #12 fix: store surfaces entries through getChildCategories which reads
// live spending array. New entries reflect immediately in budget bars.

export function AddSpendingModal({
  child,
  onClose,
}: {
  child: Child;
  onClose: () => void;
}) {
  const categories = useStore((s) => s.categories);
  const addSpendingEntry = useStore((s) => s.addSpendingEntry);
  const [category, setCategory] = useState(categories[0]?.name ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const amt = Number(amount) || 0;
  const canSubmit = amt > 0 && category;

  const handleSubmit = () => {
    if (!canSubmit) return;
    addSpendingEntry({
      childId: child.id,
      category,
      amount: amt,
      note: note || "Spending entry",
    });
    setSubmitted(true);
    setTimeout(onClose, 1100);
  };

  return (
    <ModalShell
      title="Log Spending"
      subtitle={`${child.name} · Spending Entry`}
      onClose={onClose}
      footer={
        submitted ? (
          <div className="flex items-center gap-3 text-[#6BBF8A]">
            <Check className="h-4 w-4" />
            <span className="micro-label" style={{ color: "#6BBF8A" }}>
              Logged · Budget Updated
            </span>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-ghost flex-1 px-4 py-2.5 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-gold flex-1 px-4 py-2.5 rounded text-sm"
            >
              Log Entry
            </button>
          </div>
        )
      }
    >
      <div className="space-y-5">
        <div>
          <label className="micro-label block mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-editorial w-full px-4 py-2.5 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name} className="bg-[#0E1310]">
                {c.name} · budget {formatUGX(c.budget)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="micro-label block mb-2">Amount (UGX)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            autoFocus
            className="input-editorial w-full px-4 py-3 font-editorial text-2xl tabular-nums"
          />
        </div>

        <div>
          <label className="micro-label block mb-2">Note</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was it for?"
            className="input-editorial w-full px-4 py-2.5 text-sm"
          />
        </div>
      </div>
    </ModalShell>
  );
}

// ---- Investment Detail Modal -----------------------------------------------
// Bug #6 fix: "Invest Now" button is honestly marked as disabled — no broker
// is connected in this MVP, so we don't pretend the button works.

export function InvestmentDetailModal({
  investment,
  onClose,
}: {
  investment: Investment;
  onClose: () => void;
}) {
  const gain = investment.currentValue - investment.amountInvested;
  const gainPct =
    investment.amountInvested > 0
      ? (gain / investment.amountInvested) * 100
      : 0;
  const positive = gain >= 0;

  return (
    <ModalShell
      title={investment.name}
      subtitle={`${investment.type} · Position`}
      onClose={onClose}
      footer={
        <div className="space-y-3">
          <div className="divider-gold" />
          <button
            disabled
            className="btn-gold w-full px-4 py-2.5 rounded text-sm flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
            title="Broker integration not yet available in MVP"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Invest More (Coming Soon)
          </button>
          <p className="text-[10px] text-foreground/40 text-center tracking-wide">
            Live broker integration requires a connected securities account.
          </p>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="surface-flat rounded p-5">
          <div className="micro-label mb-2">Current Value</div>
          <div className="font-editorial text-3xl text-gold-foil-static tabular-nums leading-tight">
            {formatUGX(investment.currentValue)}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <ArrowUpRight
              className={`h-3.5 w-3.5 ${positive ? "text-[#6BBF8A]" : "text-[#D4943A]"}`}
              style={{ transform: positive ? "" : "rotate(90deg)" }}
            />
            <span
              className="text-xs tabular-nums"
              style={{ color: positive ? "#6BBF8A" : "#D4943A" }}
            >
              {positive ? "+" : ""}
              {formatUGX(gain)} ({gainPct.toFixed(2)}%)
            </span>
            <span className="micro-label">all-time</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="micro-label mb-1">Principal</div>
            <div className="font-editorial text-base tabular-nums text-foreground/85">
              {formatUGX(investment.amountInvested)}
            </div>
          </div>
          <div>
            <div className="micro-label mb-1">Type</div>
            <div className="font-editorial text-base text-foreground/85">
              {investment.type}
            </div>
          </div>
          <div>
            <div className="micro-label mb-1">Opened</div>
            <div className="font-editorial text-base text-foreground/85">
              {new Date(investment.openedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
          <div>
            <div className="micro-label mb-1">Status</div>
            <span className={`pill ${investment.status === "active" ? "pill-green" : "pill-muted"}`}>
              {investment.status}
            </span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

// ---- Redeem Tokens Modal ---------------------------------------------------

export function RedeemTokensModal({
  child,
  onClose,
}: {
  child: Child;
  onClose: () => void;
}) {
  const redeemTokens = useStore((s) => s.redeemTokens);
  const tokenBalance = useStore((s) =>
    s.tokenLedger
      .filter((t) => t.childId === child.id && t.type === "parent_give")
      .reduce((sum, t) => sum + t.tokens, 0) -
    s.tokenLedger
      .filter((t) => t.childId === child.id && t.type === "redeem")
      .reduce((sum, t) => sum + t.tokens, 0)
  );

  const [tokens, setTokens] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const t = Number(tokens) || 0;
  const cashValue = t * TOKEN_REDEEM_RATE;
  const canSubmit = t > 0 && t <= tokenBalance;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const ok = redeemTokens(child.id, t);
    if (!ok) {
      setError("Not enough tokens.");
      return;
    }
    setSubmitted(true);
    setTimeout(onClose, 1100);
  };

  return (
    <ModalShell
      title="Redeem Tokens"
      subtitle={`${child.name} · Convert to Savings`}
      onClose={onClose}
      footer={
        submitted ? (
          <div className="flex items-center gap-3 text-[#6BBF8A]">
            <Check className="h-4 w-4" />
            <span className="micro-label" style={{ color: "#6BBF8A" }}>
              Redeemed · Savings Credited
            </span>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-ghost flex-1 px-4 py-2.5 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-gold flex-1 px-4 py-2.5 rounded text-sm"
            >
              Redeem {t > 0 && `· ${t} ◈`}
            </button>
          </div>
        )
      }
    >
      <div className="space-y-5">
        <div className="surface-flat rounded p-4 flex justify-between items-center">
          <div>
            <div className="micro-label mb-1">Available Balance</div>
            <div className="font-editorial text-2xl text-gold-foil-static tabular-nums">
              {tokenBalance} ◈
            </div>
          </div>
          <div className="text-right">
            <div className="micro-label mb-1">Rate</div>
            <div className="font-editorial text-sm text-foreground/80 tabular-nums">
              UGX {TOKEN_REDEEM_RATE}/◈
            </div>
          </div>
        </div>

        <div>
          <label className="micro-label block mb-2">Tokens to Redeem</label>
          <input
            type="number"
            value={tokens}
            onChange={(e) => {
              setTokens(e.target.value);
              setError("");
            }}
            placeholder="0"
            autoFocus
            className="input-editorial w-full px-4 py-3 font-editorial text-2xl tabular-nums"
          />
          {error && (
            <div className="mt-2 text-xs text-[#D4943A]">{error}</div>
          )}
        </div>

        <div className="divider-gold" />

        <div className="flex justify-between text-xs">
          <span className="micro-label">You Receive</span>
          <span
            className="font-editorial tabular-nums"
            style={{ color: "#E8D5A0" }}
          >
            {formatUGX(cashValue)}
          </span>
        </div>
      </div>
    </ModalShell>
  );
}
