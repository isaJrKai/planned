"use client";

// ============================================================================
// PARENT QUOTE EDITOR — annual theme + monthly quote
// ============================================================================
// Surfaces in the parent Settings tab. Parent edits the annual theme and
// the monthly quote. Both appear at the bottom of every child dashboard.
// ============================================================================

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Sparkles, Check, RotateCcw, BookOpen } from "lucide-react";

// A small library of suggested quotes parent can pick from.
const SUGGESTED_QUOTES: string[] = [
  "A shilling saved is a step toward the future you are building.",
  "Wealth is built quietly, one decision at a time.",
  "What you save today buys your dreams tomorrow.",
  "Patience turns small coins into a fortune.",
  "The seed you plant now will shade you later.",
  "Save first, spend second — that is the order of wealth.",
  "Discipline today is freedom tomorrow.",
  "Your future self is watching what you do today.",
];

const SUGGESTED_THEMES: string[] = [
  "2026 — The Year of Disciplined Wealth",
  "Build, Save, Grow",
  "Small Habits, Large Outcomes",
  "The Year of the Wise Saver",
  "Planting for the Harvest",
];

export function ParentQuoteEditor() {
  const annualTheme = useStore((s) => s.annualTheme);
  const monthlyQuote = useStore((s) => s.monthlyQuote);
  const setAnnualTheme = useStore((s) => s.setAnnualTheme);
  const setMonthlyQuote = useStore((s) => s.setMonthlyQuote);

  // Local draft state — only commits to store on Save.
  const [themeDraft, setThemeDraft] = useState(annualTheme);
  const [quoteDraft, setQuoteDraft] = useState(monthlyQuote);
  const [savedFlash, setSavedFlash] = useState<"theme" | "quote" | null>(null);

  // Sync drafts when store values change (e.g. resetSeed).
  useEffect(() => {
    setThemeDraft(annualTheme);
  }, [annualTheme]);
  useEffect(() => {
    setQuoteDraft(monthlyQuote);
  }, [monthlyQuote]);

  const flash = (which: "theme" | "quote") => {
    setSavedFlash(which);
    setTimeout(() => setSavedFlash(null), 1500);
  };

  const saveTheme = () => {
    setAnnualTheme(themeDraft);
    flash("theme");
  };
  const saveQuote = () => {
    setMonthlyQuote(quoteDraft);
    flash("quote");
  };

  return (
    <div className="space-y-6">
      {/* Annual theme editor */}
      <div className="surface-wood rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="micro-label-gold mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Annual Theme
            </div>
            <h3 className="font-editorial text-lg text-foreground tracking-wide">
              The Family Motto for {new Date().getFullYear()}
            </h3>
            <p className="text-xs text-foreground/55 mt-1 leading-relaxed max-w-md">
              A short, memorable phrase that frames the year for your children.
              Appears as a banner at the bottom of every child dashboard.
            </p>
          </div>
        </div>

        <div className="divider-gold mb-5" />

        <label className="micro-label block mb-2">Your Theme</label>
        <input
          type="text"
          value={themeDraft}
          onChange={(e) => setThemeDraft(e.target.value)}
          maxLength={80}
          placeholder="e.g. 2026 — The Year of Disciplined Wealth"
          className="input-editorial w-full px-4 py-3 font-editorial text-base tracking-wide"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="micro-label">{themeDraft.length}/80 characters</span>
          {savedFlash === "theme" && (
            <span
              className="text-xs flex items-center gap-1.5"
              style={{ color: "var(--chart-2)" }}
            >
              <Check className="h-3 w-3" /> Saved · visible to children
            </span>
          )}
        </div>

        {/* Suggestions */}
        <div className="mt-4">
          <div className="micro-label mb-2">Or pick a suggestion</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_THEMES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setThemeDraft(t);
                  setAnnualTheme(t);
                  flash("theme");
                }}
                className="btn-outline px-3 py-1.5 rounded text-xs tracking-wide"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={saveTheme}
            disabled={themeDraft === annualTheme}
            className="btn-gold px-4 py-2 rounded text-xs tracking-wider flex items-center gap-2"
          >
            <Check className="h-3 w-3" /> Save Theme
          </button>
          {themeDraft !== annualTheme && (
            <button
              onClick={() => setThemeDraft(annualTheme)}
              className="btn-ghost px-3 py-2 rounded text-xs tracking-wider flex items-center gap-1.5"
            >
              <RotateCcw className="h-3 w-3" /> Revert
            </button>
          )}
        </div>
      </div>

      {/* Monthly quote editor */}
      <div className="surface-wood rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="micro-label-gold mb-1 flex items-center gap-1.5">
              <BookOpen className="h-3 w-3" /> Monthly Quote
            </div>
            <h3 className="font-editorial text-lg text-foreground tracking-wide">
              A Word From Home ·{" "}
              {new Date().toLocaleDateString("en-GB", { month: "long" })}
            </h3>
            <p className="text-xs text-foreground/55 mt-1 leading-relaxed max-w-md">
              A short piece of wisdom your children will see at the bottom of
              their dashboard this month. Update it as often as you like.
            </p>
          </div>
        </div>

        <div className="divider-gold mb-5" />

        <label className="micro-label block mb-2">Your Quote</label>
        <textarea
          value={quoteDraft}
          onChange={(e) => setQuoteDraft(e.target.value)}
          maxLength={160}
          placeholder="e.g. A shilling saved is a step toward the future you are building."
          rows={3}
          className="input-editorial w-full px-4 py-3 font-editorial italic text-base leading-relaxed resize-none"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="micro-label">{quoteDraft.length}/160 characters</span>
          {savedFlash === "quote" && (
            <span
              className="text-xs flex items-center gap-1.5"
              style={{ color: "var(--chart-2)" }}
            >
              <Check className="h-3 w-3" /> Saved · visible to children
            </span>
          )}
        </div>

        {/* Suggestions */}
        <div className="mt-4">
          <div className="micro-label mb-2">Or pick a suggestion</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUOTES.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuoteDraft(q);
                  setMonthlyQuote(q);
                  flash("quote");
                }}
                className="btn-outline px-3 py-1.5 rounded text-xs tracking-wide text-left max-w-[260px] truncate"
                title={q}
              >
                &ldquo;{q}&rdquo;
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={saveQuote}
            disabled={quoteDraft === monthlyQuote}
            className="btn-gold px-4 py-2 rounded text-xs tracking-wider flex items-center gap-2"
          >
            <Check className="h-3 w-3" /> Save Quote
          </button>
          {quoteDraft !== monthlyQuote && (
            <button
              onClick={() => setQuoteDraft(monthlyQuote)}
              className="btn-ghost px-3 py-2 rounded text-xs tracking-wider flex items-center gap-1.5"
            >
              <RotateCcw className="h-3 w-3" /> Revert
            </button>
          )}
        </div>
      </div>

      {/* Live preview */}
      <div className="surface-wood-strong rounded-lg p-6">
        <div className="micro-label-gold mb-3">Live Preview · What Children See</div>
        <div className="divider-gold mb-5" />

        {/* Preview banner */}
        <div className="family-banner surface-flat rounded-lg p-5 mb-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-3 w-3" style={{ color: "var(--primary)" }} />
            <span className="micro-label-gold">
              Family Theme · {new Date().getFullYear()}
            </span>
          </div>
          <h4 className="font-editorial text-lg text-gold-foil-static tracking-editorial leading-tight">
            {themeDraft || "Your annual theme will appear here"}
          </h4>
        </div>

        {/* Preview quote */}
        <div className="text-center py-4">
          <div className="ornamental-rule max-w-xs mx-auto mb-4">
            <span className="ornamental-diamond" />
          </div>
          <blockquote
            className="font-editorial italic text-lg leading-relaxed max-w-xl mx-auto"
            style={{ color: "var(--text-soft)" }}
          >
            {quoteDraft ? (
              <>
                <span
                  className="text-2xl mr-1 align-top"
                  style={{ color: "var(--primary)", lineHeight: 0.8 }}
                >
                  &ldquo;
                </span>
                {quoteDraft}
                <span
                  className="text-2xl ml-1 align-bottom"
                  style={{ color: "var(--primary)", lineHeight: 0.8 }}
                >
                  &rdquo;
                </span>
              </>
            ) : (
              <span className="text-foreground/40">
                Your monthly quote will appear here
              </span>
            )}
          </blockquote>
          <div className="ornamental-rule max-w-xs mx-auto mt-4">
            <span className="ornamental-diamond" />
          </div>
        </div>
      </div>
    </div>
  );
}
