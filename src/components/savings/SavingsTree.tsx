// @ts-nocheck — gsap animation code needs proper migration
"use client";

// ============================================================================
// SAVINGS TREE — A living SVG tree that grows with savings
// ============================================================================
// Stages: 🌱 Seed → 🌿 Sprout → 🌳 Young Tree → 🌸 Blossom → 🌟 Golden Tree
// Each stage has animated SVG paths that grow, bloom, and attract life.
// ============================================================================

import { useRef } from "react";
import { motion } from "framer-motion";
// gsap removed
// gsap removed

/* gsap removed */;

interface SavingsTreeProps {
  percentage: number;  // 0-100
  amount: number;
  goalName: string;
}

function getStage(pct: number): number {
  if (pct >= 100) return 5; // Golden
  if (pct >= 80) return 4;  // Blossom
  if (pct >= 60) return 3;  // Young Tree
  if (pct >= 40) return 2;  // Plant
  if (pct >= 20) return 1;  // Sprout
  return 0;                  // Seed
}

const STAGE_LABELS = ["Seed", "Sprout", "Plant", "Young Tree", "Blossom", "Golden Tree"];
const STAGE_EMOJIS = ["🌰", "🌱", "🌿", "🌳", "🌸", "🌟"];
const STAGE_COLORS = ["#8B7355", "#7CB342", "#558B2F", "#2E7D32", "#EC407A", "#FFD700"];

export function SavingsTree({ percentage, amount, goalName }: SavingsTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stage = getStage(percentage);

  // Animate the tree growth on mount and when stage changes
  // useEffect block removed — needs migration
return (
    <div ref={containerRef} style={{ textAlign: "center" }}>
      {/* Tree visualization */}
      <div style={{
        position: "relative",
        height: "180px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        marginBottom: "0.5rem",
      }}>
        {/* Glow halo (stage 5 only) */}
        {stage >= 5 && (
          <div className="tree-glow" style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)",
            opacity: 0,
            pointerEvents: "none",
          }} />
        )}

        {/* SVG Tree */}
        <svg width="140" height="180" viewBox="0 0 140 180" style={{ overflow: "visible" }}>
          {/* Ground */}
          <ellipse className="tree-ground" cx="70" cy="175" rx="40" ry="6" fill="rgba(0,0,0,0.3)" />

          {/* Seed (stage 0) */}
          {stage === 0 && (
            <motion.circle
              cx="70" cy="172" r="6"
              fill="#8B7355"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
            />
          )}

          {/* Sprout (stage 1+) */}
          {stage >= 1 && (
            <>
              {/* Stem */}
              <path
                className="tree-branch"
                d="M 70 175 Q 68 150 70 130 Q 72 110 70 90"
                stroke={STAGE_COLORS[stage]}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
              {/* Leaves */}
              <circle className="tree-leaf" cx="60" cy="125" r="6" fill={STAGE_COLORS[stage]} opacity="0.8" />
              <circle className="tree-leaf" cx="80" cy="115" r="5" fill={STAGE_COLORS[stage]} opacity="0.7" />
            </>
          )}

          {/* Plant (stage 2+) */}
          {stage >= 2 && (
            <>
              {/* More branches */}
              <path
                className="tree-branch"
                d="M 70 130 Q 55 120 50 105 Q 48 95 52 85"
                stroke={STAGE_COLORS[stage]}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              <path
                className="tree-branch"
                d="M 70 130 Q 85 120 90 105 Q 92 95 88 85"
                stroke={STAGE_COLORS[stage]}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              {/* More leaves */}
              <circle className="tree-leaf" cx="50" cy="100" r="7" fill={STAGE_COLORS[stage]} opacity="0.7" />
              <circle className="tree-leaf" cx="90" cy="100" r="7" fill={STAGE_COLORS[stage]} opacity="0.7" />
              <circle className="tree-leaf" cx="70" cy="80" r="8" fill={STAGE_COLORS[stage]} opacity="0.8" />
            </>
          )}

          {/* Young Tree (stage 3+) */}
          {stage >= 3 && (
            <>
              {/* Trunk thickens */}
              <path
                className="tree-branch"
                d="M 70 175 Q 68 140 70 100 Q 72 70 70 50"
                stroke="#5D4037"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />
              {/* Canopy */}
              <circle className="tree-leaf" cx="70" cy="45" r="22" fill={STAGE_COLORS[stage]} opacity="0.6" />
              <circle className="tree-leaf" cx="55" cy="55" r="18" fill={STAGE_COLORS[stage]} opacity="0.7" />
              <circle className="tree-leaf" cx="85" cy="55" r="18" fill={STAGE_COLORS[stage]} opacity="0.7" />
              <circle className="tree-leaf" cx="65" cy="35" r="15" fill={STAGE_COLORS[stage]} opacity="0.8" />
              <circle className="tree-leaf" cx="78" cy="40" r="14" fill={STAGE_COLORS[stage]} opacity="0.75" />
            </>
          )}

          {/* Blossom (stage 4+) */}
          {stage >= 4 && (
            <>
              {/* Flowers on canopy */}
              <circle className="tree-flower" cx="60" cy="40" r="4" fill="#FF6B9D" opacity="0" />
              <circle className="tree-flower" cx="75" cy="35" r="4" fill="#FF6B9D" opacity="0" />
              <circle className="tree-flower" cx="82" cy="50" r="3" fill="#FFAB91" opacity="0" />
              <circle className="tree-flower" cx="55" cy="55" r="3" fill="#FF6B9D" opacity="0" />
              <circle className="tree-flower" cx="68" cy="30" r="4" fill="#FFAB91" opacity="0" />
              <circle className="tree-flower" cx="88" cy="42" r="3" fill="#FF6B9D" opacity="0" />
            </>
          )}

          {/* Golden Tree (stage 5) */}
          {stage >= 5 && (
            <>
              {/* Golden overlay on canopy */}
              <circle cx="70" cy="45" r="24" fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.5" />
              <circle cx="55" cy="55" r="20" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.4" />
              <circle cx="85" cy="55" r="20" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.4" />
            </>
          )}
        </svg>
      </div>

      {/* Stage label */}
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: STAGE_COLORS[stage],
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "0.25rem",
        }}
      >
        {STAGE_EMOJIS[stage]} {STAGE_LABELS[stage]}
      </motion.div>

      {/* Amount */}
      <div style={{
        fontFamily: "var(--font-playfair), Georgia, serif",
        fontSize: "1.75rem",
        fontWeight: 700,
        color: "#ffffff",
        textShadow: "0 2px 10px rgba(0,0,0,0.3)",
      }}>
        {amount.toLocaleString()}
      </div>

      {/* Goal name */}
      <div style={{
        fontSize: "0.7rem",
        color: "rgba(255,255,255,0.4)",
        marginBottom: "0.75rem",
      }}>
        Growing toward: {goalName}
      </div>

      {/* Progress bar */}
      <div style={{
        width: "100%",
        height: "8px",
        background: "rgba(255,255,255,0.08)",
        borderRadius: "4px",
        overflow: "hidden",
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, percentage)}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${STAGE_COLORS[stage]}, ${STAGE_COLORS[Math.min(stage + 1, 5)]})`,
            borderRadius: "4px",
            boxShadow: `0 0 10px ${STAGE_COLORS[stage]}40`,
          }}
        />
      </div>
      <div style={{
        fontSize: "0.7rem",
        color: STAGE_COLORS[stage],
        textAlign: "center",
        marginTop: "0.25rem",
        fontWeight: 600,
      }}>
        {Math.round(percentage)}% grown
      </div>
    </div>
  );
}
