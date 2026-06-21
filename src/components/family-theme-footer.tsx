"use client";

// ============================================================================
// FAMILY THEME FOOTER — annual theme + monthly quote
// ============================================================================
// Shown at the bottom of the CHILD dashboard. Parent sets both fields from
// the parent Settings tab. The footer is a quiet, editorial reminder of the
// family's wealth-building intention — never loud, always elegant.
//
// Design:
//   - Annual theme: small banner at top with gold corner flourishes
//   - Monthly quote: large italic Playfair, centered, with ornamental rule
//   - "Set by Parent" micro-label so the child knows it's intentional
// ============================================================================

import { useStore } from "@/lib/store";
import { Sparkles } from "lucide-react";

export function FamilyThemeFooter() {
  const annualTheme = useStore((s) => s.annualTheme);
  const monthlyQuote = useStore((s) => s.monthlyQuote);

  // Don't render if both are empty.
  if (!annualTheme && !monthlyQuote) return null;

  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <footer className="mt-12 mb-6">
      {/* Annual theme banner */}
      {annualTheme && (
        <div className="family-banner surface-wood rounded-lg p-6 mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles
              className="h-3 w-3"
              style={{ color: "var(--primary)" }}
            />
            <span className="micro-label-gold">Family Theme · {now.getFullYear()}</span>
          </div>
          <h3
            className="font-editorial text-xl md:text-2xl text-gold-foil-static tracking-editorial leading-tight"
          >
            {annualTheme}
          </h3>
        </div>
      )}

      {/* Monthly quote */}
      {monthlyQuote && (
        <div className="text-center px-4 py-8">
          {/* Ornamental rule */}
          <div className="ornamental-rule max-w-md mx-auto mb-6">
            <span className="ornamental-diamond" />
          </div>

          <div className="micro-label mb-4">
            {monthLabel} · A Word From Home
          </div>

          <blockquote
            className="font-editorial italic text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto"
            style={{ color: "var(--text-soft)" }}
          >
            <span
              className="font-editorial text-3xl mr-1 align-top"
              style={{ color: "var(--primary)", lineHeight: 0.8 }}
            >
              &ldquo;
            </span>
            {monthlyQuote}
            <span
              className="font-editorial text-3xl ml-1 align-bottom"
              style={{ color: "var(--primary)", lineHeight: 0.8 }}
            >
              &rdquo;
            </span>
          </blockquote>

          {/* Ornamental rule */}
          <div className="ornamental-rule max-w-md mx-auto mt-6">
            <span className="ornamental-diamond" />
          </div>

          <div className="micro-label mt-4">
            Set with love · by Parent
          </div>
        </div>
      )}
    </footer>
  );
}
