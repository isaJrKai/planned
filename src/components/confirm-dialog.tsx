"use client";
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
interface P { open: boolean; title: string; description: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; requireTyping?: string; onConfirm: () => void; onCancel: () => void; }
export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", destructive = false, requireTyping, onConfirm, onCancel }: P) {
  const [t, setT] = useState("");
  if (!open) return null;
  const can = !requireTyping || t === requireTyping;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="surface-wood-strong rounded-lg p-6 max-w-md w-full" style={{ border: destructive ? "1px solid var(--chart-3)" : "1px solid var(--hairline-strong)" }}>
        <div className="flex items-start gap-3 mb-4">
          {destructive && <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "var(--chart-3)" }} />}
          <div className="flex-1"><h2 className="font-editorial text-lg text-foreground mb-1">{title}</h2><p className="text-xs text-foreground/60">{description}</p></div>
          <button onClick={onCancel} className="p-1 text-foreground/40 hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        {requireTyping && <div className="mb-4"><p className="text-[10px] tracking-wider uppercase text-foreground/50 mb-1.5">Type <span style={{ color: "var(--chart-3)" }}>{requireTyping}</span> to confirm</p><input type="text" value={t} onChange={(e) => setT(e.target.value)} className="input-editorial" autoFocus /></div>}
        <div className="flex gap-2"><button onClick={onCancel} className="btn-ghost flex-1 px-4 py-2 rounded text-xs tracking-wider">{cancelLabel}</button><button onClick={onConfirm} disabled={!can} className="flex-1 px-4 py-2 rounded text-xs tracking-wider disabled:opacity-30" style={destructive ? { background: "var(--chart-3)", color: "white" } : {}}>{confirmLabel}</button></div>
        <style jsx>{`:global(.input-editorial){width:100%;background:var(--surface-flat);border:1px solid var(--hairline-strong);color:var(--foreground);padding:0.5rem 0.75rem;border-radius:0.375rem;font-size:0.875rem;outline:none;}`}</style>
      </div>
    </div>
  );
}
