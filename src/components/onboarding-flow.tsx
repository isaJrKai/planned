"use client";

// ============================================================================
// ONBOARDING — first-launch experience
// ============================================================================
// 4 screens + final CTA. Editorial, calm, premium. No flashy animations.
// Detects first visit via localStorage, shows onboarding, then dashboard.
// ============================================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Home, BookOpen, Sprout, ArrowRight, Check, Shield, Sparkles,
} from "lucide-react";

const ONBOARDED_KEY = "planned-onboarded";

interface OnboardingScreen {
  icon: any;
  headline: string;
  body: string;
  illustration: "family" | "book" | "growth" | "welcome";
}

const SCREENS: OnboardingScreen[] = [
  {
    icon: Home,
    headline: "Welcome to Planned",
    body: "A place where families build intentional financial habits together.",
    illustration: "welcome",
  },
  {
    icon: Home,
    headline: "Build Better Habits Together",
    body: "Create goals, develop routines, and celebrate progress as a family.",
    illustration: "family",
  },
  {
    icon: BookOpen,
    headline: "Learn Along the Journey",
    body: "Financial literacy becomes a shared family experience through lessons, quizzes, and real-world practice.",
    illustration: "book",
  },
  {
    icon: Sprout,
    headline: "Small Steps Become Lasting Futures",
    body: "One habit today can shape generations tomorrow. Consistency matters more than amount.",
    illustration: "growth",
  },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [screen, setScreen] = useState(0);
  const [isLast, setIsLast] = useState(false);

  const current = SCREENS[screen];
  const isFinal = isLast;

  const handleNext = () => {
    if (screen < SCREENS.length - 1) {
      setScreen(screen + 1);
    } else {
      setIsLast(true);
    }
  };

  const handleFinish = () => {
    localStorage.setItem(ONBOARDED_KEY, "true");
    router.push("/");
    // Force a reload so the main app loads fresh
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "var(--background)", position: "relative", zIndex: 10 }}
    >
      <div className="ambient-backdrop" aria-hidden />

      <div
        className="relative w-full max-w-md"
        style={{ animation: "onboarding-fade 0.4s ease-out both" }}
      >
        {/* Logo at top */}
        {!isFinal && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <div
              className="h-8 w-8 rounded-lg overflow-hidden"
              style={{ animation: "splash-fade-in 0.5s ease-out both" }}
            >
              <svg viewBox="0 0 1024 1024" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="obBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0A4D5C"/>
                    <stop offset="100%" stopColor="#1A5C4D"/>
                  </linearGradient>
                  <linearGradient id="obGold" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#E8D5A0"/>
                    <stop offset="50%" stopColor="#C9A84C"/>
                    <stop offset="100%" stopColor="#B8941F"/>
                  </linearGradient>
                </defs>
                <rect width="1024" height="1024" rx="228" ry="228" fill="url(#obBg)"/>
                <path d="M 512 280 L 512 560 L 270 620 L 250 540 Z" fill="url(#obGold)"/>
                <path d="M 512 280 L 512 560 L 754 620 L 774 540 Z" fill="url(#obGold)"/>
                <rect x="504" y="280" width="16" height="280" fill="url(#obGold)"/>
                <circle cx="440" cy="700" r="32" fill="url(#obGold)"/>
                <circle cx="584" cy="700" r="32" fill="url(#obGold)"/>
                <path d="M 400 760 Q 440 730 480 760" fill="none" stroke="url(#obGold)" strokeWidth="10" strokeLinecap="round"/>
                <path d="M 544 760 Q 584 730 624 760" fill="none" stroke="url(#obGold)" strokeWidth="10" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-editorial text-sm tracking-editorial text-foreground/60">PLANNED</span>
          </div>
        )}

        {/* Final screen */}
        {isFinal ? (
          <div className="text-center" style={{ animation: "onboarding-fade 0.5s ease-out both" }}>
            {/* Icon */}
            <div
              className="mx-auto mb-6 h-20 w-20 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{
                background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                border: "1px solid var(--hairline-strong)",
              }}
            >
              <svg viewBox="0 0 1024 1024" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="finalBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0A4D5C"/>
                    <stop offset="100%" stopColor="#1A5C4D"/>
                  </linearGradient>
                  <linearGradient id="finalGold" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#E8D5A0"/>
                    <stop offset="50%" stopColor="#C9A84C"/>
                    <stop offset="100%" stopColor="#B8941F"/>
                  </linearGradient>
                </defs>
                <rect width="1024" height="1024" rx="228" ry="228" fill="url(#finalBg)"/>
                <path d="M 512 280 L 512 560 L 270 620 L 250 540 Z" fill="url(#finalGold)"/>
                <path d="M 512 280 L 512 560 L 754 620 L 774 540 Z" fill="url(#finalGold)"/>
                <rect x="504" y="280" width="16" height="280" fill="url(#finalGold)"/>
                <circle cx="440" cy="700" r="32" fill="url(#finalGold)"/>
                <circle cx="584" cy="700" r="32" fill="url(#finalGold)"/>
                <path d="M 400 760 Q 440 730 480 760" fill="none" stroke="url(#finalGold)" strokeWidth="10" strokeLinecap="round"/>
                <path d="M 544 760 Q 584 730 624 760" fill="none" stroke="url(#finalGold)" strokeWidth="10" strokeLinecap="round"/>
              </svg>
            </div>

            <h1 className="font-editorial text-2xl text-foreground tracking-editorial mb-3">
              Let&apos;s Build Your Family Space
            </h1>
            <p className="text-sm text-foreground/55 leading-relaxed mb-6 max-w-xs mx-auto">
              Your family&apos;s financial journey starts here. Set goals, track savings, learn together —
              one habit at a time.
            </p>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-4 mb-8 text-[10px] text-foreground/40">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Private</span>
              <span className="flex items-center gap-1"><Check className="h-3 w-3" /> No ads</span>
              <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Educational</span>
            </div>

            <button
              onClick={handleFinish}
              className="btn-gold w-full px-6 py-3.5 rounded text-sm tracking-wider flex items-center justify-center gap-2"
            >
              Create My Family <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-[9px] text-foreground/30 mt-4">
              Your data stays private and secure.
            </p>
          </div>
        ) : (
          /* Onboarding screens */
          <div className="text-center">
            {/* Illustration area */}
            <div
              className="mx-auto mb-8 flex items-center justify-center"
              style={{
                width: 200,
                height: 200,
                animation: "onboarding-scale 0.5s ease-out both",
              }}
            >
              <OnboardingIllustration type={current.illustration} />
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {SCREENS.map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: i === screen ? 24 : 6,
                    height: 3,
                    background: i === screen ? "var(--primary)" : "var(--hairline-strong)",
                    transition: "width 0.3s ease, background 0.3s ease",
                  }}
                />
              ))}
            </div>

            {/* Headline */}
            <h1
              className="font-editorial text-2xl text-foreground tracking-editorial mb-3"
              style={{ animation: "onboarding-fade 0.4s ease-out 0.1s both" }}
            >
              {current.headline}
            </h1>

            {/* Body */}
            <p
              className="text-sm text-foreground/55 leading-relaxed mb-8 max-w-xs mx-auto"
              style={{ animation: "onboarding-fade 0.4s ease-out 0.2s both" }}
            >
              {current.body}
            </p>

            {/* CTA */}
            <button
              onClick={handleNext}
              className="btn-gold w-full px-6 py-3 rounded text-sm tracking-wider flex items-center justify-center gap-2"
            >
              {screen === 0 ? "Get Started" : "Continue"} <ArrowRight className="h-4 w-4" />
            </button>

            {/* Skip */}
            {screen < SCREENS.length - 1 && (
              <button
                onClick={handleFinish}
                className="btn-ghost mt-3 text-[10px] tracking-wider"
              >
                Skip introduction
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes onboarding-fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes onboarding-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; }
        }
      `}} />
    </div>
  );
}

// ---- Illustrations (inline SVG, editorial style) ---------------------------

function OnboardingIllustration({ type }: { type: string }) {
  if (type === "welcome") {
    return (
      <svg viewBox="0 0 200 200" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        {/* House/Book roof */}
        <path d="M 100 50 L 100 130 L 50 145 L 40 95 Z" fill="var(--primary)" opacity="0.9"/>
        <path d="M 100 50 L 100 130 L 150 145 L 160 95 Z" fill="var(--primary)" opacity="0.7"/>
        <rect x="97" y="50" width="6" height="80" fill="var(--primary)"/>
        {/* Family dots */}
        <circle cx="80" cy="165" r="10" fill="var(--primary)" opacity="0.8"/>
        <circle cx="120" cy="165" r="10" fill="var(--primary)" opacity="0.8"/>
        <line x1="68" y1="180" x2="92" y2="180" stroke="var(--primary)" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
        <line x1="108" y1="180" x2="132" y2="180" stroke="var(--primary)" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
      </svg>
    );
  }
  if (type === "family") {
    return (
      <svg viewBox="0 0 200 200" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        {/* Roof */}
        <path d="M 40 60 L 100 30 L 160 60 L 160 70 L 100 40 L 40 70 Z" fill="var(--primary)" opacity="0.6"/>
        {/* Family figures */}
        <circle cx="70" cy="100" r="14" fill="var(--primary)" opacity="0.9"/>
        <circle cx="100" cy="95" r="16" fill="var(--primary)" opacity="0.7"/>
        <circle cx="130" cy="100" r="14" fill="var(--primary)" opacity="0.9"/>
        {/* Bodies */}
        <path d="M 55 140 Q 70 120 85 140" fill="none" stroke="var(--primary)" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
        <path d="M 85 140 Q 100 115 115 140" fill="none" stroke="var(--primary)" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
        <path d="M 115 140 Q 130 120 145 140" fill="none" stroke="var(--primary)" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
        {/* Ground line */}
        <line x1="40" y1="155" x2="160" y2="155" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
      </svg>
    );
  }
  if (type === "book") {
    return (
      <svg viewBox="0 0 200 200" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        {/* Open book */}
        <path d="M 100 50 L 100 140 L 45 130 L 45 60 Z" fill="var(--primary)" opacity="0.8"/>
        <path d="M 100 50 L 100 140 L 155 130 L 155 60 Z" fill="var(--primary)" opacity="0.6"/>
        <rect x="97" y="50" width="6" height="90" fill="var(--primary)"/>
        {/* Page lines */}
        <line x1="60" y1="80" x2="90" y2="75" stroke="var(--background)" stroke-width="2" opacity="0.3"/>
        <line x1="60" y1="95" x2="90" y2="90" stroke="var(--background)" stroke-width="2" opacity="0.2"/>
        <line x1="110" y1="75" x2="140" y2="80" stroke="var(--background)" stroke-width="2" opacity="0.3"/>
        <line x1="110" y1="90" x2="140" y2="95" stroke="var(--background)" stroke-width="2" opacity="0.2"/>
        {/* Growth sprout */}
        <path d="M 100 140 Q 95 160 90 170" fill="none" stroke="var(--chart-2)" stroke-width="3" stroke-linecap="round"/>
        <circle cx="88" cy="165" r="4" fill="var(--chart-2)" opacity="0.7"/>
      </svg>
    );
  }
  if (type === "growth") {
    return (
      <svg viewBox="0 0 200 200" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        {/* Seed/sprout growing */}
        <ellipse cx="100" cy="170" rx="30" ry="6" fill="var(--primary)" opacity="0.3"/>
        {/* Stem */}
        <path d="M 100 170 Q 98 140 100 100" fill="none" stroke="var(--chart-2)" stroke-width="3" stroke-linecap="round"/>
        {/* Leaves */}
        <ellipse cx="85" cy="135" rx="12" ry="6" fill="var(--chart-2)" opacity="0.6" transform="rotate(-30 85 135)"/>
        <ellipse cx="115" cy="120" rx="14" ry="7" fill="var(--chart-2)" opacity="0.7" transform="rotate(30 115 120)"/>
        {/* Top */}
        <circle cx="100" cy="95" r="8" fill="var(--primary)" opacity="0.8"/>
        {/* Coins falling (representing savings) */}
        <circle cx="70" cy="60" r="5" fill="var(--primary)" opacity="0.4"/>
        <circle cx="130" cy="55" r="4" fill="var(--primary)" opacity="0.3"/>
        <circle cx="110" cy="40" r="3" fill="var(--primary)" opacity="0.2"/>
      </svg>
    );
  }
  return null;
}

// ---- Hook: check if onboarding is needed ----------------------------------

export function useOnboardingCheck() {
  // Use lazy initial state — runs once on mount, no effect needed
  const [needsOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(ONBOARDED_KEY);
  });
  const checked = true; // Always checked since we use lazy init

  return { needsOnboarding, checked };
}
