"use client";
import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/money";

export function cx(...parts: (string | false | null | undefined)[]) { return parts.filter(Boolean).join(" "); }

type Tone = "brand" | "save" | "goal" | "spend" | "grow" | "neutral";
const toneText: Record<Tone, string> = { brand: "text-brand", save: "text-save", goal: "text-goal", spend: "text-spend", grow: "text-grow", neutral: "text-ink-2" };
const toneBg: Record<Tone, string> = { brand: "bg-brand-soft text-brand", save: "bg-save-soft text-save", goal: "bg-goal-soft text-goal", spend: "bg-spend-soft text-spend", grow: "bg-grow-soft text-grow", neutral: "bg-warm-2 text-ink-2" };
const toneBar: Record<Tone, string> = { brand: "bg-brand", save: "bg-save", goal: "bg-goal", spend: "bg-spend", grow: "bg-grow", neutral: "bg-ink-3" };

/* ---------- Button ---------- */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "lg"; loading?: boolean; href?: string };
export function Button({ variant = "primary", size = "md", loading, href, className, children, disabled, ...rest }: BtnProps) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none";
  const sizes = { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4 text-[14.5px]", lg: "h-12 px-5 text-[15.5px]" }[size];
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-strong",
    secondary: "bg-paper text-ink border border-line-strong hover:bg-warm",
    ghost: "text-ink-2 hover:bg-warm hover:text-ink",
    danger: "bg-spend text-white hover:bg-[#a92626]",
  }[variant];
  const cls = cx(base, sizes, variants, className);
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/* ---------- Form field ---------- */
type FieldProps = { label: string; hint?: string; error?: string; children: React.ReactNode; htmlFor?: string };
export function Field({ label, hint, error, children, htmlFor }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13.5px] font-medium text-ink-2">{label}</label>
      {children}
      {error ? <p className="text-[13px] text-spend" role="alert">{error}</p> : hint ? <p className="text-[13px] text-ink-3">{hint}</p> : null}
    </div>
  );
}
export const inputCls = "w-full h-10 px-3 rounded-md border border-line-strong bg-paper text-ink placeholder:text-ink-4 text-[15px] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:bg-warm aria-[invalid=true]:border-spend";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cx(inputCls, className)} {...p} />;
});
export function Select({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(inputCls, "pr-8", className)} {...p} />;
}
export function Textarea({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputCls, "h-auto py-2 min-h-[88px]", className)} {...p} />;
}

/* ---------- Surfaces ---------- */
export function Card({ className, children, as: Tag = "section" }: { className?: string; children: React.ReactNode; as?: "section" | "div" | "article" }) {
  return <Tag className={cx("bg-paper border border-line rounded-lg", className)}>{children}</Tag>;
}
export function SectionTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <h2 className="text-[19px] font-semibold text-ink">{title}</h2>
        {sub && <p className="text-[14px] text-ink-3 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 h-6 px-2 rounded-full text-[12.5px] font-medium", toneBg[tone], className)}>{children}</span>;
}
export function ToneText({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cx(toneText[tone], className)}>{children}</span>;
}

/* ---------- Progress ---------- */
export function Progress({ value, tone = "save", className, label }: { value: number; tone?: Tone; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cx("h-2 w-full rounded-full bg-warm-2 overflow-hidden", className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cx("h-full rounded-full transition-[width] duration-500", toneBar[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}

/* ---------- Money ---------- */
export function Money({ amount, currency, signed, className, compact }: { amount: number; currency: string; signed?: boolean; className?: string; compact?: boolean }) {
  const s = formatMoney(amount, currency, { signed });
  const [cur, ...rest] = s.split(" ");
  const num = rest.join(" ");
  return (
    <span className={cx("tnum whitespace-nowrap", className)}>
      {compact ? <>{s.startsWith("−") || s.startsWith("+") ? s[0] : ""}{num}</> : <><span className="text-[0.72em] font-medium text-ink-3 mr-1 align-baseline">{cur.replace(/[−+]/, "")}</span>{s.startsWith("−") || s.startsWith("+") ? s[0] : ""}{num}</>}
    </span>
  );
}

/* ---------- Loading & empty ---------- */
export function Skeleton({ className }: { className?: string }) { return <div className={cx("skeleton", className)} aria-hidden />; }
export function EmptyState({ title, body, action, icon }: { title: string; body?: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="text-center py-12 px-6">
      {icon && <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-warm-2 text-ink-3 grid place-items-center">{icon}</div>}
      <h3 className="text-[17px] font-semibold text-ink">{title}</h3>
      {body && <p className="text-[14.5px] text-ink-3 mt-1 max-w-sm mx-auto">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export function Notice({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <div className={cx("rounded-md px-3.5 py-2.5 text-[14px]", toneBg[tone])} role={tone === "spend" ? "alert" : "status"}>{children}</div>;
}

/* ---------- Dialog (native) ---------- */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className={cx("relative w-full bg-paper rounded-t-lg sm:rounded-lg border border-line shadow-[var(--shadow-soft)] max-h-[92vh] overflow-y-auto rise", wide ? "sm:max-w-2xl" : "sm:max-w-md")}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-md text-ink-3 hover:bg-warm grid place-items-center" aria-label="Close">×</button>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Fetch helper for client mutations ---------- */
export async function api<T = unknown>(url: string, opts: { method?: string; body?: unknown; idempotent?: boolean } = {}): Promise<{ ok: true; data: T } | { ok: false; error: { code: string; message: string; details?: Record<string, string[]> } }> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.idempotent) headers["idempotency-key"] = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
  try {
    const res = await fetch(url, { method: opts.method ?? "POST", headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
    const json = await res.json().catch(() => ({ ok: false, error: { code: "bad_json", message: "Unexpected response." } }));
    return json;
  } catch {
    return { ok: false, error: { code: "network", message: "You appear to be offline. Try again in a moment." } };
  }
}
export function fieldError(err: { details?: Record<string, string[]> } | undefined, name: string) { return err?.details?.[name]?.[0]; }
