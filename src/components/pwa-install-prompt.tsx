"use client";

// ============================================================================
// PWA INSTALL PROMPT — detect installability + show install banner
// ============================================================================

import { useEffect, useState } from "react";
import { Download, X, Sparkles } from "lucide-react";

const DISMISS_KEY = "planned-install-dismissed";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches;
  });

  useEffect(() => {
    if (installed) return;

    // Check if dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after 3 seconds (don't interrupt immediately)
      setTimeout(() => setShowBanner(() => true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful install
    const installedHandler = () => {
      setInstalled(() => true);
      setShowBanner(() => false);
      setDeferredPrompt(() => null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  // Don't show if already installed or no prompt available
  if (installed || !showBanner || !deferredPrompt) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm"
      style={{ animation: "toast-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
    >
      <div className="surface-wood-strong rounded-lg p-4 flex items-center gap-3 shadow-2xl" style={{
        borderLeft: "3px solid var(--primary)",
      }}>
        {/* Icon */}
        <div
          className="h-10 w-10 rounded-lg overflow-hidden shrink-0"
        >
          <svg viewBox="0 0 1024 1024" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="installBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0A4D5C"/>
                <stop offset="100%" stopColor="#1A5C4D"/>
              </linearGradient>
              <linearGradient id="installGold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E8D5A0"/>
                <stop offset="50%" stopColor="#C9A84C"/>
                <stop offset="100%" stopColor="#B8941F"/>
              </linearGradient>
            </defs>
            <rect width="1024" height="1024" rx="228" ry="228" fill="url(#installBg)"/>
            <path d="M 512 280 L 512 560 L 270 620 L 250 540 Z" fill="url(#installGold)"/>
            <path d="M 512 280 L 512 560 L 754 620 L 774 540 Z" fill="url(#installGold)"/>
            <rect x="504" y="280" width="16" height="280" fill="url(#installGold)"/>
            <circle cx="440" cy="700" r="32" fill="url(#installGold)"/>
            <circle cx="584" cy="700" r="32" fill="url(#installGold)"/>
            <path d="M 400 760 Q 440 730 480 760" fill="none" stroke="url(#installGold)" strokeWidth="10" strokeLinecap="round"/>
            <path d="M 544 760 Q 584 730 624 760" fill="none" stroke="url(#installGold)" strokeWidth="10" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-foreground tracking-wide font-editorial">
            Install Planned
          </div>
          <div className="text-[10px] text-foreground/50 mt-0.5">
            Add to your home screen for a full-screen experience
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            className="btn-gold px-3 py-1.5 rounded text-[10px] tracking-wider flex items-center gap-1.5"
          >
            <Download className="h-3 w-3" /> Install
          </button>
          <button
            onClick={handleDismiss}
            className="btn-ghost p-1.5 rounded"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- iOS install instructions (for Safari which doesn't support beforeinstallprompt) ----

export function IOSInstallHint() {
  const [showHint, setShowHint] = useState(false);
  const isIOS = typeof window !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream &&
    !window.matchMedia("(display-mode: standalone)").matches &&
    !localStorage.getItem(DISMISS_KEY);

  useEffect(() => {
    if (isIOS) {
      const timer = setTimeout(() => setShowHint(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isIOS]);

  if (!isIOS || !showHint) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm"
      style={{ animation: "toast-in 0.4s ease-out both" }}
    >
      <div className="surface-wood-strong rounded-lg p-4 shadow-2xl" style={{
        borderLeft: "3px solid var(--primary)",
      }}>
        <div className="flex items-start gap-3">
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
          <div className="flex-1">
            <div className="text-xs text-foreground tracking-wide font-editorial mb-1">
              Install on iPhone
            </div>
            <div className="text-[10px] text-foreground/50 leading-relaxed">
              Tap the Share button <span className="font-mono">⎙</span> in Safari, then
              &ldquo;Add to Home Screen&rdquo; to install Planned as an app.
            </div>
          </div>
          <button
            onClick={() => {
              setShowHint(false);
              localStorage.setItem(DISMISS_KEY, "true");
            }}
            className="btn-ghost p-1 rounded"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
