"use client";

// ============================================================================
// SWIMMING MASCOT — The dolphin actually swims across the screen
// ============================================================================
// Not a bouncing emoji. A creature that lives in this world.
// Follows a wave-like path, rotates with direction, leaves a trail.
// ============================================================================

import { motion } from "framer-motion";

interface SwimmingMascotProps {
  emoji: string;
  size?: number;
}

export function SwimmingMascot({ emoji, size = 48 }: SwimmingMascotProps) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 5 }}>
      {/* Main swimming path — crosses the screen on a wave */}
      <motion.div
        animate={{
          x: ["-10%", "110%"],
          y: [
            "20%", "15%", "25%", "18%", "30%", "22%", "15%", "25%", "20%"
          ],
          rotate: [-5, 5, -3, 8, -5, 3, -8, 5, -5],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.12, 0.25, 0.37, 0.5, 0.62, 0.75, 0.87, 1],
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          fontSize: `${size}px`,
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
        }}
      >
        {emoji}
      </motion.div>

      {/* Second pass — different path, different timing, smaller */}
      <motion.div
        animate={{
          x: ["110%", "-10%"],
          y: [
            "45%", "50%", "42%", "55%", "48%", "40%", "52%", "45%"
          ],
          rotate: [180, 175, 183, 172, 185, 177, 188, 180],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
          times: [0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 1],
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          fontSize: `${size * 0.6}px`,
          opacity: 0.5,
          filter: "blur(1px) drop-shadow(0 2px 8px rgba(0,0,0,0.2))",
        }}
      >
        {emoji}
      </motion.div>

      {/* Tiny distant swimmer */}
      <motion.div
        animate={{
          x: ["-5%", "105%"],
          y: ["60%", "58%", "62%", "57%", "63%", "60%"],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
          delay: 10,
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          fontSize: `${size * 0.35}px`,
          opacity: 0.25,
          filter: "blur(2px)",
        }}
      >
        {emoji}
      </motion.div>
    </div>
  );
}
