"use client";

// ============================================================================
// SHARED UI PRIMITIVES — Toast, EmptyState, Skeleton, MobileNav
// ============================================================================
// Reusable presentation components used across all features.
// ============================================================================

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";

// ---- Toast System ----------------------------------------------------------

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  body?: string;
}

interface ToastContextValue {
  toast: (input: { type: ToastType; title: string; body?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast: () => {} };
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(({ type, title, body }: { type: ToastType; title: string; body?: string }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, body }]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen for toast events from mutations (which can't use React context)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { type: ToastType; title: string; body?: string };
      toast(detail);
    };
    window.addEventListener("planned-toast", handler);
    return () => window.removeEventListener("planned-toast", handler);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="toast-container" role="region" aria-label="Notifications">
          {toasts.map((t) => {
            const Icon = t.type === "success" ? CheckCircle2 : t.type === "error" ? AlertCircle : Info;
            return (
              <div
                key={t.id}
                className={`toast toast-${t.type}`}
                role="alert"
                onClick={() => dismiss(t.id)}
              >
                <Icon
                  className="h-4 w-4 shrink-0"
                  style={{
                    color: t.type === "success" ? "var(--chart-2)" : t.type === "error" ? "var(--destructive)" : "var(--primary)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground tracking-wide">{t.title}</div>
                  {t.body && <div className="text-[10px] text-foreground/50 mt-0.5">{t.body}</div>}
                </div>
                <X className="h-3 w-3 text-foreground/30 shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

// ---- Empty State -----------------------------------------------------------

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
      </div>
      <div className="empty-state-title">{title}</div>
      {body && <div className="empty-state-body">{body}</div>}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-gold px-4 py-2 rounded text-xs tracking-wider mt-4"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ---- Skeleton Loading ------------------------------------------------------

export function SkeletonCard() {
  return (
    <div className="surface-wood rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton skeleton-text" style={{ width: 80 }} />
        <div className="skeleton" style={{ width: 14, height: 14, borderRadius: "50%" }} />
      </div>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" style={{ width: 100 }} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
      <div className="flex-1">
        <div className="skeleton skeleton-text" style={{ width: "60%" }} />
        <div className="skeleton skeleton-text" style={{ width: "40%", height: 8 }} />
      </div>
      <div className="skeleton" style={{ width: 60, height: 16 }} />
    </div>
  );
}

// ---- Mobile Bottom Navigation ----------------------------------------------

interface MobileNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export function MobileBottomNav({
  items,
  activeId,
  onSelect,
}: {
  items: MobileNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="mobile-bottom-nav hide-desktop" aria-label="Main navigation">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`mobile-bottom-nav-item ${activeId === item.id ? "active" : ""}`}
          aria-label={item.label}
          aria-current={activeId === item.id ? "page" : undefined}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ---- Reveal on Scroll ------------------------------------------------------

export function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    const elements = document.querySelectorAll(".reveal:not(.visible)");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}
