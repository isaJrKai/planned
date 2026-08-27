"use client";
import { useState, FormEvent } from "react";
import { Lock, Eye, EyeOff, ArrowRight, Shield, Check } from "lucide-react";
import Link from "next/link";

export function SignupForm({ style }: { style?: React.CSSProperties }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const checks = { length: password.length >= 12, hasUpper: /[A-Z]/.test(password), hasLower: /[a-z]/.test(password), hasNumber: /[0-9]/.test(password) };
  const score = Object.values(checks).filter(Boolean).length;
  const canSubmit = score >= 4 && name.trim().length >= 2 && email.includes("@");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null); setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? "Registration failed"); setSubmitting(false); return; }
      setSuccess(true); setSubmitting(false);
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    } catch { setError("Network error"); setSubmitting(false); }
  }

  if (success) return (
    <div style={style} className="surface-wood-strong rounded-lg p-8 text-center">
      <Check className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--chart-2)" }} />
      <h1 className="font-editorial text-xl text-foreground mb-2">Account Created!</h1>
      <p className="text-xs text-foreground/55">Redirecting to login...</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={style} className="surface-wood-strong rounded-lg p-8">
      <div className="text-center mb-6">
        <Shield className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--primary)" }} />
        <h1 className="font-editorial text-2xl text-foreground mb-1">Create Account</h1>
        <p className="text-xs text-foreground/55">Join your family's financial journey.</p>
      </div>
      <div className="divider-gold mb-6" />
      <div className="mb-4"><label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Name</label><input type="text" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className="input-editorial" autoFocus /></div>
      <div className="mb-4"><label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-editorial" /></div>
      <div className="mb-4"><label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Password</label><div className="relative"><input type={showPassword ? "text" : "password"} required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} className="input-editorial pr-10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5">{showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button></div></div>
      {error && <div className="mb-3 p-2 rounded text-xs" style={{ color: "var(--chart-3)" }}>{error}</div>}
      <button type="submit" disabled={submitting || !canSubmit} className="btn-gold w-full px-6 py-3 rounded text-sm tracking-wider disabled:opacity-50">{submitting ? "Creating..." : "Create Account"}</button>
      <p className="text-center mt-3 text-[10px] text-foreground/40">Already have an account? <Link href="/login" className="underline">Sign in</Link></p>
      <style jsx>{`:global(.input-editorial){width:100%;background:var(--surface-flat);border:1px solid var(--hairline-strong);color:var(--foreground);padding:0.625rem 0.875rem;border-radius:0.375rem;font-size:0.875rem;outline:none;}:global(.input-editorial:focus){border-color:var(--primary);}`}</style>
    </form>
  );
}
