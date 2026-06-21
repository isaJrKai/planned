"use client";

import { useState, FormEvent } from "react";
import { Lock, Eye, EyeOff, ArrowRight, Shield, Smartphone, KeyRound } from "lucide-react";

interface LoginFormProps {
  nextPath: string;
  style?: React.CSSProperties;
}

export function LoginForm({ nextPath, style }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  async function handleInitialSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (data.twoFactorRequired && data.twoFactorChallenge) { setTwoFactorChallenge(data.twoFactorChallenge); setSubmitting(false); return; }
      if (!res.ok || !data.ok) { setError(data.error ?? "Login failed"); setSubmitting(false); return; }
      window.location.href = nextPath;
    } catch { setError("Network error. Please try again."); setSubmitting(false); }
  }

  async function handle2FASubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challenge: twoFactorChallenge, code: totpCode }) });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? "Invalid 2FA code"); setSubmitting(false); return; }
      window.location.href = nextPath;
    } catch { setError("Network error. Please try again."); setSubmitting(false); }
  }

  if (twoFactorChallenge) {
    return (
      <form onSubmit={handle2FASubmit} style={style} className="surface-wood-strong rounded-lg p-8">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)", border: "1px solid var(--hairline-strong)" }}>
            <Smartphone className="h-5 w-5" style={{ color: "var(--primary)" }} />
          </div>
          <div className="micro-label-gold mb-2">Two-Factor Authentication</div>
          <h1 className="font-editorial text-2xl text-foreground tracking-editorial mb-2">Enter Your Code</h1>
          <p className="text-xs text-foreground/55">Open your authenticator app and enter the 6-digit code.<br /><span className="text-[10px] text-foreground/40">Or use a backup code if you don&apos;t have your device.</span></p>
        </div>
        <div className="divider-gold mb-6" />
        <div className="mb-4">
          <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Authentication Code</label>
          <input type="text" required value={totpCode} onChange={(e) => setTotpCode(e.target.value)} className="input-editorial text-center text-lg tracking-[0.3em] font-mono" placeholder="000000" maxLength={20} autoComplete="one-time-code" inputMode="numeric" autoFocus />
        </div>
        {error && <div className="mb-4 p-3 rounded text-xs" style={{ background: "color-mix(in srgb, var(--chart-3) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--chart-3) 40%, transparent)", color: "var(--chart-3)" }}>{error}</div>}
        <button type="submit" disabled={submitting || totpCode.length < 6} className="btn-gold w-full px-6 py-3 rounded text-sm tracking-wider flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? "Verifying…" : <><KeyRound className="h-4 w-4" /> Verify &amp; Sign In <ArrowRight className="h-4 w-4" /></>}
        </button>
        <button type="button" onClick={() => { setTwoFactorChallenge(null); setTotpCode(""); setError(null); }} className="btn-ghost w-full mt-3 text-[10px] tracking-wider">← Back to password</button>
        <style jsx>{`:global(.input-editorial){width:100%;background:var(--surface-flat);border:1px solid var(--hairline-strong);color:var(--foreground);padding:0.75rem 0.875rem;border-radius:0.375rem;font-size:0.875rem;outline:none;transition:border-color 0.2s;}:global(.input-editorial:focus){border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 15%,transparent);}`}</style>
      </form>
    );
  }

  return (
    <form onSubmit={handleInitialSubmit} style={style} className="surface-wood-strong rounded-lg p-8">
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)", border: "1px solid var(--hairline-strong)" }}>
          <Shield className="h-5 w-5" style={{ color: "var(--primary)" }} />
        </div>
        <div className="micro-label-gold mb-2">Planned</div>
        <h1 className="font-editorial text-2xl text-foreground tracking-editorial mb-2">Founder Sign In</h1>
        <p className="text-xs text-foreground/55">Enter your founder credentials to access the dashboard.</p>
      </div>
      <div className="divider-gold mb-6" />
      <div className="mb-4">
        <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-editorial" autoComplete="email" autoFocus />
      </div>
      <div className="mb-4">
        <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Password</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="input-editorial pr-10" autoComplete="current-password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-foreground/40 hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      {error && <div className="mb-4 p-3 rounded text-xs" style={{ background: "color-mix(in srgb, var(--chart-3) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--chart-3) 40%, transparent)", color: "var(--chart-3)" }}>{error}</div>}
      <button type="submit" disabled={submitting} className="btn-gold w-full px-6 py-3 rounded text-sm tracking-wider flex items-center justify-center gap-2 disabled:opacity-50">
        {submitting ? "Signing in…" : <><Lock className="h-4 w-4" /> Sign In <ArrowRight className="h-4 w-4" /></>}
      </button>
      <p className="text-[9px] text-foreground/30 text-center mt-4">Protected by bcrypt + JWT + HttpOnly cookie + optional 2FA.</p>
      <style jsx>{`:global(.input-editorial){width:100%;background:var(--surface-flat);border:1px solid var(--hairline-strong);color:var(--foreground);padding:0.625rem 0.875rem;border-radius:0.375rem;font-size:0.875rem;outline:none;transition:border-color 0.2s;}:global(.input-editorial:focus){border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 15%,transparent);}`}</style>
    </form>
  );
}
