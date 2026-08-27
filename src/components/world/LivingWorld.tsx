// @ts-nocheck — dead code or missing dependency
"use client";

// ============================================================================
// LIVING WORLD — The ambient environment that makes the dashboard breathe
// ============================================================================
// Three parallax layers: far (stars/light), mid (particles), near (foreground)
// The entire world gently breathes (scale 1 → 1.01 → 1 over 18s)
// Light changes based on time of day
// ============================================================================

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const TIME_OF_DAY = () => {
  const hour = new Date().getHours();
  if (hour < 6) return "night";
  if (hour < 10) return "morning";
  if (hour < 16) return "afternoon";
  if (hour < 19) return "evening";
  return "night";
};

const SKY_GRADIENTS: Record<string, string> = {
  morning: "linear-gradient(180deg, #1a3a5c 0%, #2d5a8e 30%, #4a90D9 60%, #74B9FF 100%)",
  afternoon: "linear-gradient(180deg, #0a1929 0%, #0d2847 30%, #1a3a5c 70%, #2d5a8e 100%)",
  evening: "linear-gradient(180deg, #1a0a2e 0%, #2d1b4e 30%, #4a2d6e 60%, #6e3e8e 100%)",
  night: "linear-gradient(180deg, #050814 0%, #0a1228 30%, #0d1a35 60%, #102440 100%)",
};

export function LivingWorld({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const timeOfDay = TIME_OF_DAY();

  // World breathing — the entire dashboard gently scales
  useGSAP(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !worldRef.current) return;

    gsap.to(worldRef.current, {
      scale: 1.01,
      duration: 9,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      force3D: true,
    });
  }, { scope: containerRef });

  // Mouse parallax — layers move with cursor
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const handleMouse = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const xPercent = (clientX / innerWidth - 0.5) * 2;
      const yPercent = (clientY / innerHeight - 0.5) * 2;

      const farLayer = containerRef.current.querySelector(".parallax-far") as HTMLElement;
      const midLayer = containerRef.current.querySelector(".parallax-mid") as HTMLElement;
      const nearLayer = containerRef.current.querySelector(".parallax-near") as HTMLElement;

      if (farLayer) gsap.to(farLayer, { x: xPercent * 10, y: yPercent * 5, duration: 2, ease: "power2.out" });
      if (midLayer) gsap.to(midLayer, { x: xPercent * 20, y: yPercent * 10, duration: 1.5, ease: "power2.out" });
      if (nearLayer) gsap.to(nearLayer, { x: xPercent * 30, y: yPercent * 15, duration: 1, ease: "power2.out" });
    };

    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      {/* === FAR LAYER: Sky + Stars + Light rays === */}
      <div
        className="parallax-far"
        style={{
          position: "absolute",
          inset: "-5%",
          zIndex: 1,
          transition: "background 2s ease",
        }}
      >
        {/* Sky gradient */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: SKY_GRADIENTS[timeOfDay],
          transition: "background 2s ease",
        }} />

        {/* Stars (night only) */}
        {timeOfDay === "night" && (
          <>
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{
                  duration: 2 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
                style={{
                  position: "absolute",
                  top: `${(i * 7.3) % 60}%`,
                  left: `${(i * 11.7) % 100}%`,
                  width: "2px",
                  height: "2px",
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 0 4px rgba(255,255,255,0.8)",
                }}
              />
            ))}
          </>
        )}

        {/* Light rays */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={`ray-${i}`}
            animate={{
              x: ["-30%", "130%"],
              opacity: [0, 0.08, 0],
            }}
            transition={{
              duration: 20 + i * 8,
              repeat: Infinity,
              ease: "linear",
              delay: i * 4,
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "50%",
              height: "100%",
              background: `linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)`,
              transform: `skewX(${-12 + i * 4}deg)`,
            }}
          />
        ))}
      </div>

      {/* === MID LAYER: Floating particles + ambient life === */}
      <div
        className="parallax-mid"
        style={{
          position: "absolute",
          inset: "-3%",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        {/* Floating motes */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`mote-${i}`}
            animate={{
              y: [0, -40 - (i % 3) * 20, 0],
              x: [0, Math.sin(i * 0.5) * 30, 0],
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: 10 + (i % 5) * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
            style={{
              position: "absolute",
              bottom: "5%",
              left: `${(i * 5.3) % 100}%`,
              width: `${3 + (i % 3) * 2}px`,
              height: `${3 + (i % 3) * 2}px`,
              borderRadius: "50%",
              background: i % 4 === 0 ? "rgba(255,217,61,0.6)" : "rgba(255,255,255,0.4)",
              boxShadow: i % 4 === 0 ? "0 0 6px rgba(255,217,61,0.3)" : "none",
            }}
          />
        ))}

        {/* Occasional bird silhouette */}
        <motion.div
          animate={{
            x: ["-10%", "110%"],
            y: [`${15 + Math.random() * 10}%`, `${20 + Math.random() * 10}%`, `${15 + Math.random() * 10}%`],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 15,
            repeatDelay: 60,
          }}
          style={{
            position: "absolute",
            top: "15%",
            fontSize: "0.8rem",
            opacity: 0.15,
          }}
        >
          🕊️
        </motion.div>
      </div>

      {/* === NEAR LAYER: Content (children) === */}
      <div
        ref={worldRef}
        className="parallax-near"
        style={{
          position: "relative",
          zIndex: 10,
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </div>
  );
}
