"use client";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "./confirm-dialog";
import { resetFamilyData } from "@/lib/mutations";
export function DangerZone() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function reset() { setBusy(true); try { await resetFamilyData(); window.location.reload(); } catch { setBusy(false); setOpen(false); } }
  return (
    <div className="rounded-lg p-6" style={{ border: "1px solid var(--chart-3)", background: "color-mix(in srgb, var(--chart-3) 5%, transparent)" }}>
      <div className="flex items-center gap-2 mb-3"><AlertTriangle className="h-4 w-4" style={{ color: "var(--chart-3)" }} /><h3 className="font-editorial text-sm text-foreground tracking-wider uppercase">Danger Zone</h3></div>
      <p className="text-xs text-foreground/60 mb-4">These actions are permanent and cannot be undone.</p>
      <div className="flex items-center justify-between py-3" style={{ borderTop: "1px solid var(--hairline-strong)" }}>
        <div><p className="text-sm text-foreground">Reset all family data</p><p className="text-[10px] text-foreground/50">Deletes all children, transactions, goals, spending, investments, and tokens.</p></div>
        <button onClick={() => setOpen(true)} className="px-3 py-1.5 rounded text-[10px] tracking-wider" style={{ background: "var(--chart-3)", color: "white" }}>Reset Everything</button>
      </div>
      <ConfirmDialog open={open} title="Reset ALL family data?" description="This will permanently delete ALL data. This CANNOT be undone." confirmLabel={busy ? "Resetting..." : "Yes, delete everything"} destructive requireTyping="DELETE EVERYTHING" onConfirm={reset} onCancel={() => setOpen(false)} />
    </div>
  );
}
