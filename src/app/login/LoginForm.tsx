"use client";

import { useState, FormEvent } from "react";
import { Lock, Eye, EyeOff, ArrowRight, Shield, Smartphone, KeyRound } from "lucide-react";
import Link from "next/link";

interface LoginFormProps {
  nextPath: string;
  style?: React.CSSProperties;
}

const MASCOTS = [
  { emoji: "🐢", name: "turtle", label: "Turtle" },
  { emoji: "🐰", name: "rabbit", label: "Rabbit" },
  { emoji: "🐥", name: "chick", label: "Chick" },
  { emoji: "🐼", name: "panda", label: "Panda" },
  { emoji: "🐧", name: "penguin", label: "Penguin" },
  { emoji: "🐨", name: "koala", label: "Koala" },
  { emoji: "🦊", name: "fox", label: "Fox" },
  { emoji: "🐬", name: "dolphin", label: "Dolphin" },
  { emoji: "🦉", name: "owl", label: "Owl" },
  { emoji: "🐿️", name: "squirrel", label: "Squirrel" },
  { emoji: "🦝", name: "raccoon", label: "Raccoon" },
  { emoji: "🦅", name: "eagle", label: "Eagle" },
  { emoji: "🐺", name: "wolf", label: "Wolf" },
  { emoji: "🦁", name: "lion", label: "Lion" },
  { emoji: "🐙", name: "octopus", label: "Octopus" },
  { emoji: "🐉", name: "dragon", label: "Dragon" },
  { emoji: "🐆", name: "leopard", label: "Leopard" },
];

export function LoginForm({ nextPath, style }: LoginFormProps) {
  const [loginMode, setLoginMode] = useState<"parent" | "child">("parent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [childStep, setChildStep] = useState<1 | 2>(1);
  const [selectedMascot, setSelectedMascot] = useState<string | null>(null);
  const [childName, setChildName] = useState("");
  const [childPin, setChildPin] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (loginMode === "child") {
      if (childStep === 1) {
        if (!selectedMascot) { setError("Pick your animal friend!"); setSubmitting(false); return; }
        setChildStep(2);
        setSubmitting(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/child-login", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mascot: selectedMascot, name: childName, pin: childPin }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) { setError(data.error ?? "Login failed"); setSubmitting(false); return; }
        window.location.reload();
      } catch { setError("Network error. Try again!"); setSubmitting(false); }
      return;
    }

    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (data.twoFactorRequired && data.twoFactorChallenge) { setTwoFactorChallenge(data.twoFactorChallenge); setSubmitting(false); return; }
      if (!res.ok || !data.ok) { setError(data.error ?? "Login failed"); setSubmitting(false); return; }
      window.location.reload();
    } catch { setError("Network error. Try again!"); setSubmitting(false); }
  }

  if (twoFactorChallenge) {
    return (
      <form onSubmit={async (e: FormEvent) => {
        e.preventDefault(); setError(null); setSubmitting(true);
        try {
          const res = await fetch("/api/auth/verify-2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challenge: twoFactorChallenge, code: totpCode }) });
          const data = await res.json();
          if (!res.ok || !data.ok) { setError(data.error ?? "Invalid 2FA code"); setSubmitting(false); return; }
          window.location.reload();
        } catch { setError("Network error"); setSubmitting(false); }
      }} style={style} className="surface-wood-strong rounded-lg p-8">
        <div className="text-center mb-6">
          <Smartphone className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--primary)" }} />
          <h1 className="font-editorial text-2xl text-foreground mb-2">Enter Your Code</h1>
          <p className="text-xs text-foreground/55">Open your authenticator app and enter the 6-digit code.</p>
        </div>
        <div className="divider-gold mb-6" />
        <div className="mb-4">
          <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Authentication Code</label>
          <input type="text" required value={totpCode} onChange={(e) => setTotpCode(e.target.value)} className="input-editorial text-center text-lg tracking-[0.3em] font-mono" placeholder="000000" maxLength={20} autoComplete="one-time-code" inputMode="numeric" autoFocus />
        </div>
        {error && <div className="mb-4 p-3 rounded text-xs" style={{ color: "var(--chart-3)" }}>{error}</div>}
        <button type="submit" disabled={submitting || totpCode.length < 6} className="btn-gold w-full px-6 py-3 rounded text-sm tracking-wider disabled:opacity-50">
          {submitting ? "Verifying…" : "Verify & Sign In"}
        </button>
        <button type="button" onClick={() => { setTwoFactorChallenge(null); setTotpCode(""); setError(null); }} className="btn-ghost w-full mt-3 text-[10px] tracking-wider">← Back to password</button>
        <style jsx>{`:global(.input-editorial){width:100%;background:var(--surface-flat);border:1px solid var(--hairline-strong);color:var(--foreground);padding:0.75rem 0.875rem;border-radius:0.375rem;font-size:0.875rem;outline:none;}:global(.input-editorial:focus){border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 15%,transparent);}`}</style>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={style} className="surface-wood-strong rounded-lg p-8">
      <div className="text-center mb-6">
        <Shield className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--primary)" }} />
        <h1 className="font-editorial text-2xl text-foreground mb-1">{loginMode === "parent" ? "Sign In" : "Kids Login"}</h1>
        <p className="text-xs text-foreground/55">{loginMode === "parent" ? "Enter your credentials to access the dashboard." : "Enter your name and secret code."}</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button type="button" onClick={() => { setLoginMode("parent"); setError(null); setChildStep(1); }} className={`flex-1 px-3 py-2 rounded text-[10px] tracking-wider ${loginMode === "parent" ? "btn-gold" : "btn-ghost"}`}>Parent</button>
        <button type="button" onClick={() => { setLoginMode("child"); setError(null); setChildStep(1); }} className={`flex-1 px-3 py-2 rounded text-[10px] tracking-wider ${loginMode === "child" ? "btn-gold" : "btn-ghost"}`}>Kids</button>
      </div>

      {loginMode === "parent" ? (
        <>
          <div className="divider-gold mb-6" />
          <div className="mb-4">
            <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-editorial" autoComplete="email" autoFocus />
          </div>
          <div className="mb-4">
            <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="input-editorial pr-10" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5">{showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </>
      ) : childStep === 1 ? (
        <>
          <div className="divider-gold mb-6" />
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-4">
            {MASCOTS.map((m) => (
              <button key={m.name} type="button" onClick={() => { setSelectedMascot(m.name); setError(null); }} className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${selectedMascot === m.name ? "border-2 border-[var(--primary)]" : "border-2 border-transparent hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]"}`}>
                <span style={{ fontSize: "2rem" }}>{m.emoji}</span>
                <span className="text-[9px] tracking-wider uppercase text-foreground/50">{m.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="divider-gold mb-6" />
          <div className="text-center mb-4">
            <span style={{ fontSize: "3rem" }}>{MASCOTS.find(m => m.name === selectedMascot)?.emoji}</span>
          </div>
          <div className="mb-4">
            <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Your Name</label>
            <input type="text" required value={childName} onChange={(e) => setChildName(e.target.value)} className="input-editorial" autoFocus />
          </div>
          <div className="mb-4">
            <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Secret Code</label>
            <input type="password" required value={childPin} onChange={(e) => setChildPin(e.target.value.replace(/\D/g, "").slice(0, 4))} className="input-editorial text-center text-2xl tracking-[0.5em] font-mono" placeholder="••••" maxLength={4} inputMode="numeric" />
          </div>
          <button type="button" onClick={() => { setChildStep(1); setError(null); }} className="btn-ghost w-full text-[10px] tracking-wider mb-2">← Back to mascots</button>
        </>
      )}

      {error && <div className="mb-4 p-3 rounded text-xs" style={{ background: "color-mix(in srgb, var(--chart-3) 10%, transparent)", color: "var(--chart-3)" }}>{error}</div>}

      <button type="submit" disabled={submitting || (loginMode === "child" && childStep === 1 && !selectedMascot)} className="btn-gold w-full px-6 py-3 rounded text-sm tracking-wider disabled:opacity-50">
        {submitting ? "One moment…" : loginMode === "child" && childStep === 1 ? "Next" : "Sign In"}
      </button>

      {loginMode === "parent" && (
        <div className="text-center mt-3">
          <p className="text-[10px] text-foreground/40">Don&apos;t have an account? <Link href="/signup" className="text-foreground/60 hover:text-foreground underline">Sign up</Link></p>
        </div>
      )}

      <style jsx>{`:global(.input-editorial){width:100%;background:var(--surface-flat);border:1px solid var(--hairline-strong);color:var(--foreground);padding:0.625rem 0.875rem;border-radius:0.375rem;font-size:0.875rem;outline:none;}:global(.input-editorial:focus){border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 15%,transparent);}`}</style>
    </form>
  );
}
