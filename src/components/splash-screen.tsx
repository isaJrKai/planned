"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "planned-splash-shown-v1";
const HOLD_MS = 3000;
const FADE_MS = 500;
const RESOLVE_MS = HOLD_MS - FADE_MS;

export function SplashScreen() {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (sessionStorage.getItem(SESSION_KEY)) return false;
    sessionStorage.setItem(SESSION_KEY, "1");
    return true;
  });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const fadeTimer = setTimeout(() => setFading(true), RESOLVE_MS);
    const hideTimer = setTimeout(() => setVisible(false), HOLD_MS);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, [visible]);

  if (!visible) return null;

  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--background, #090C0A)", gap: "1.5rem", opacity: fading ? 0 : 1, transition: `opacity ${FADE_MS}ms ease-out`, pointerEvents: fading ? "none" : "auto" }}>
      <div className="splash-icon" style={{ width: 96, height: 96, borderRadius: 22, overflow: "hidden", animation: "splash-fade-in 0.8s ease-out both, splash-scale 3s ease-out both" }}>
        <svg viewBox="0 0 1024 1024" width="96" height="96" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="splashBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0A4D5C"/><stop offset="100%" stopColor="#1A5C4D"/></linearGradient>
            <linearGradient id="splashGold" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#E8D5A0"/><stop offset="50%" stopColor="#C9A84C"/><stop offset="100%" stopColor="#B8941F"/></linearGradient>
          </defs>
          <rect width="1024" height="1024" rx="228" ry="228" fill="url(#splashBg)"/>
          <path d="M 512 280 L 512 560 L 270 620 L 250 540 Z" fill="url(#splashGold)"/>
          <path d="M 512 280 L 512 560 L 754 620 L 774 540 Z" fill="url(#splashGold)"/>
          <rect x="504" y="280" width="16" height="280" fill="url(#splashGold)"/>
          <circle cx="440" cy="700" r="32" fill="url(#splashGold)"/>
          <circle cx="584" cy="700" r="32" fill="url(#splashGold)"/>
          <path d="M 400 760 Q 440 730 480 760" fill="none" stroke="url(#splashGold)" strokeWidth="10" strokeLinecap="round"/>
          <path d="M 544 760 Q 584 730 624 760" fill="none" stroke="url(#splashGold)" strokeWidth="10" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ animation: "splash-fade-in 0.8s ease-out 0.5s both" }}>
        <h1 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "1.75rem", fontWeight: 700, letterSpacing: "0.15em", color: "var(--foreground, #E8E4D8)", margin: 0, textAlign: "center" }}>PLANNED</h1>
        <p style={{ fontFamily: "var(--font-sans), system-ui, sans-serif", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--text-softer, rgba(232,228,216,0.5))", marginTop: "0.5rem", textAlign: "center", animation: "splash-fade-in 0.8s ease-out 0.8s both" }}>Helping Families Build Intentional Futures</p>
      </div>
      <div style={{ width: 120, height: 2, background: "rgba(201, 168, 76, 0.15)", borderRadius: 1, overflow: "hidden", marginTop: "0.5rem", animation: "splash-fade-in 0.5s ease-out 1s both" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg, #C9A84C, #E8D5A0)", borderRadius: 1, animation: "splash-load 2.2s ease-in-out 0.8s both" }} />
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes splash-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes splash-scale { 0% { transform: scale(0.92); } 30% { transform: scale(1.02); } 60% { transform: scale(1); } 100% { transform: scale(1); } }
        @keyframes splash-load { from { width: 0%; } to { width: 100%; } }
        @media (prefers-reduced-motion: reduce) { .splash-icon { animation: splash-fade-in 0.3s ease-out both !important; } }
      `}} />
    </div>
  );
}
