"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Check, Lock, ArrowRight, Smartphone, KeyRound } from "lucide-react";

interface SetupFormProps {
  defaultEmail: string;
  style?: React.CSSProperties;
}

const SUGGESTED_QUESTIONS = [
  "What is the full name of your first childhood best friend?",
  "What was the model of your first car?",
  "What is the middle name of your oldest sibling?",
  "What was the name of the street you grew up on?",
  "What was the name of your favorite teacher in primary school?",
  "What is the title of the first book you remember loving?",
];

export function SetupForm({ defaultEmail, style }: SetupFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState(SUGGESTED_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [want2FA, setWant2FA] = useState(false);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [loadingQR, setLoadingQR] = useState(false);

  const passwordChecks = {
    length: password.length >= 12,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;

  async function loadQrCode() {
    setLoadingQR(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/setup-2fa-secret?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? "Failed to generate QR code"); setWant2FA(false); }
      else { setTotpSecret(data.totpSecret); setQrCodeDataUrl(data.qrCodeDataUrl); }
    } catch { setError("Failed to load QR code"); setWant2FA(false); }
    setLoadingQR(false);
  }

  function toggle2FA(enabled: boolean) {
    setWant2FA(enabled);
    if (enabled && !totpSecret) loadQrCode();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { name, email, password, securityQuestion, securityAnswer };
      if (want2FA && totpSecret) { payload.totpSecret = totpSecret; payload.totpVerificationCode = totpCode; }
      const res = await fetch("/api/auth/setup", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? "Setup failed"); setSubmitting(false); return; }
      router.replace("/admin");
    } catch { setError("Network error. Please try again."); setSubmitting(false); }
  }

  const canSubmit = passwordScore >= 3 && (!want2FA || (totpSecret && totpCode.length >= 6));

  return (
    <form onSubmit={handleSubmit} style={style} className="surface-wood-strong rounded-lg p-8 md:p-10">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)", border: "1px solid var(--hairline-strong)" }}>
          <Shield className="h-5 w-5" style={{ color: "var(--primary)" }} />
        </div>
        <div className="micro-label-gold mb-2">Founder Initialization</div>
        <h1 className="font-editorial text-2xl md:text-3xl text-foreground tracking-editorial mb-2">Create the Founder Account</h1>
        <p className="text-xs text-foreground/55 leading-relaxed max-w-sm mx-auto">This screen appears only once. After this account is created, setup is permanently disabled.</p>
      </div>
      <div className="divider-gold mb-6" />

      <Field label="Founder Name">
        <input type="text" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Founder" className="input-editorial" autoComplete="name" />
      </Field>

      <Field label="Founder Email">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-editorial" autoComplete="email" />
        <p className="text-[10px] text-foreground/40 mt-1.5">This email will be the single super-admin of the platform.</p>
      </Field>

      <Field label="Password">
        <div className="relative">
          <input type={showPassword ? "text" : "password"} required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 12 characters" className="input-editorial pr-10" autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-foreground/40 hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        {password.length > 0 && (
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: i < passwordScore ? passwordScore >= 4 ? "var(--chart-2)" : passwordScore >= 3 ? "var(--primary)" : "var(--chart-3)" : "var(--hairline-strong)" }} />
              ))}
            </div>
            <span className="text-[10px] text-foreground/40 w-12 text-right">{passwordScore <= 1 ? "Weak" : passwordScore === 2 ? "Fair" : passwordScore === 3 ? "Good" : "Strong"}</span>
          </div>
        )}
      </Field>

      <Field label="Security Question (recovery)">
        <input type="text" required minLength={10} value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)} className="input-editorial" list="suggested-questions" />
        <datalist id="suggested-questions">{SUGGESTED_QUESTIONS.map((q) => <option key={q} value={q} />)}</datalist>
      </Field>

      <Field label="Security Answer">
        <input type="text" required minLength={2} value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} className="input-editorial" autoComplete="off" />
        <p className="text-[10px] text-foreground/40 mt-1.5">Stored as a cryptographic hash — we cannot read it back.</p>
      </Field>

      <div className="divider-gold my-6" />

      <Field label="Two-Factor Authentication (recommended)">
        <label className="flex items-start gap-3 cursor-pointer p-3 rounded" style={{ background: want2FA ? "color-mix(in srgb, var(--primary) 8%, transparent)" : "var(--surface-flat)", border: `1px solid ${want2FA ? "var(--primary)" : "var(--hairline-strong)"}` }}>
          <input type="checkbox" checked={want2FA} onChange={(e) => toggle2FA(e.target.checked)} className="mt-0.5 h-3.5 w-3.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Smartphone className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
              <span className="text-xs text-foreground font-medium">Enable TOTP 2FA now</span>
              {want2FA && <Check className="h-3 w-3" style={{ color: "var(--chart-2)" }} />}
            </div>
            <p className="text-[10px] text-foreground/50 leading-relaxed">Adds a second factor to your login. Strongly recommended.</p>
          </div>
        </label>
        {want2FA && (
          <div className="mt-4 p-4 rounded" style={{ background: "var(--surface-flat)", border: "1px solid var(--hairline-strong)" }}>
            {loadingQR && <div className="text-xs text-foreground/50 text-center py-6">Generating QR code…</div>}
            {!loadingQR && qrCodeDataUrl && (
              <>
                <p className="text-[11px] text-foreground/60 mb-3"><strong>Step 1.</strong> Scan this QR code with your authenticator app.</p>
                <div className="flex justify-center mb-4"><img src={qrCodeDataUrl} alt="2FA QR code" width={200} height={200} style={{ borderRadius: 8 }} /></div>
                <details className="mb-4">
                  <summary className="text-[10px] text-foreground/40 cursor-pointer">Can&apos;t scan? Show manual entry key</summary>
                  <code className="block mt-2 p-2 rounded text-[10px] font-mono break-all" style={{ background: "var(--background)", color: "var(--foreground)" }}>{totpSecret}</code>
                </details>
                <p className="text-[11px] text-foreground/60 mb-2"><strong>Step 2.</strong> Enter the 6-digit code from your app:</p>
                <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} className="input-editorial text-center text-lg tracking-[0.3em] font-mono" placeholder="000000" maxLength={6} autoComplete="one-time-code" inputMode="numeric" />
              </>
            )}
          </div>
        )}
      </Field>

      {error && <div className="mt-4 p-3 rounded text-xs" style={{ background: "color-mix(in srgb, var(--chart-3) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--chart-3) 40%, transparent)", color: "var(--chart-3)" }}>{error}</div>}

      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-foreground/40 flex-wrap">
        <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> bcrypt hashed</span>
        <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> HttpOnly cookie</span>
        <span className="flex items-center gap-1"><Check className="h-3 w-3" /> One-time only</span>
        {want2FA && <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> 2FA enabled</span>}
      </div>

      <button type="submit" disabled={submitting || !canSubmit} className="btn-gold w-full mt-6 px-6 py-3 rounded text-sm tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
        {submitting ? "Creating account…" : <><KeyRound className="h-4 w-4" /> Initialize Founder Account <ArrowRight className="h-4 w-4" /></>}
      </button>

      <style jsx>{`
        :global(.input-editorial) { width: 100%; background: var(--surface-flat); border: 1px solid var(--hairline-strong); color: var(--foreground); padding: 0.625rem 0.875rem; border-radius: 0.375rem; font-size: 0.875rem; outline: none; transition: border-color 0.2s; }
        :global(.input-editorial:focus) { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent); }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
