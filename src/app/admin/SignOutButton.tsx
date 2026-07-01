"use client";

import { useState } from "react";

export function SignOutButton() {
  const [signingOut, setSigningOut] = useState(false);
  async function handleSignOut() {
    setSigningOut(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); } finally { window.location.href = "/login"; }
  }
  return (
    <button type="button" onClick={handleSignOut} disabled={signingOut} className="btn-ghost px-3 py-1.5 rounded text-[11px] tracking-wider disabled:opacity-50">
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
