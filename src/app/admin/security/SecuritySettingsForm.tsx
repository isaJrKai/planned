"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, ShieldQuestion, Lock, Eye, EyeOff, Check, ArrowRight, Smartphone, KeyRound, Download, AlertTriangle, RefreshCw, Key } from "lucide-react";

interface Props {
  currentEmail: string;
  twoFactorEnabled: boolean;
  backupCodesRemaining: number;
}

const SUGGESTED_QUESTIONS = [
  "What is the full name of your first childhood best friend?",
  "What was the model of your first car?",
  "What is the middle name of your oldest sibling?",
  "What was the name of the street you grew up on?",
  "What was the name of your favorite teacher in primary school?",
  "What is the title of the first book you remember loving?",
];

export function SecuritySettingsForm({ currentEmail, twoFactorEnabled: initialTwoFactorEnabled, backupCodesRemaining: initialBackupCodesRemaining }: Props) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [wantEmailChange, setWantEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [wantQChange, setWantQChange] = useState(false);
  const [newQuestion, setNewQuestion] = useState(SUGGESTED_QUESTIONS[0]);
  const [newAnswer, setNewAnswer] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialTwoFactorEnabled);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(initialBackupCodesRemaining);
  const [enrollmentStep, setEnrollmentStep] = useState<"idle" | "verify" | "backup">("idle");
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [enrollTotpCode, setEnrollTotpCode] = useState("");
  const [enrollPassword, setEnrollPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disableTotpCode, setDisableTotpCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [wantPasswordChange, setWantPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordTotpCode, setPasswordTotpCode] = useState("");

  const wantsChange = wantEmailChange || wantQChange;
  const canSubmit = wantsChange && currentPassword.length > 0 && (!wantEmailChange || (newEmail.includes("@") && newEmail.toLowerCase() !== currentEmail)) && (!wantQChange || (newQuestion.trim().length >= 10 && newAnswer.trim().length >= 2)) && (!twoFactorEnabled || totpCode.length >= 6);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setSubmitting(true);
    try {
      const body: Record<string, string> = { currentPassword };
      if (wantEmailChange) body.newEmail = newEmail;
      if (wantQChange) { body.newSecurityQuestion = newQuestion; body.newSecurityAnswer = newAnswer; }
      if (twoFactorEnabled) body.totpCode = totpCode;
      const res = await fetch("/api/admin/security", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? "Update failed"); setSubmitting(false); return; }
      const parts: string[] = [];
      if (data.changed?.includes("email")) parts.push("Email updated");
      if (data.changed?.includes("security_question")) parts.push("Security question updated");
      setSuccess(parts.join(" · ") + ". Your session has been refreshed.");
      setCurrentPassword(""); setTotpCode(""); setWantEmailChange(false); setWantQChange(false); setNewEmail(""); setNewAnswer(""); setSubmitting(false);
      setTimeout(() => router.refresh(), 1500);
    } catch { setError("Network error. Please try again."); setSubmitting(false); }
  }

  async function startEnrollment() {
    setError(null); setEnrollmentStep("verify");
    try {
      const res = await fetch("/api/admin/2fa/enroll");
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? "Failed to generate QR code"); setEnrollmentStep("idle"); return; }
      setTotpSecret(data.totpSecret); setQrCodeDataUrl(data.qrCodeDataUrl);
    } catch { setError("Failed to load QR code"); setEnrollmentStep("idle"); }
  }

  async function completeEnrollment() {
    setError(null); setSubmitting(true);
    try {
      const res = await fetch("/api/admin/2fa/enroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: enrollPassword, totpSecret, totpVerificationCode: enrollTotpCode }) });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? "Enrollment failed"); setSubmitting(false); return; }
      setBackupCodes(data.backupCodes ?? []); setTwoFactorEnabled(true); setBackupCodesRemaining(data.backupCodes?.length ?? 0); setEnrollmentStep("backup"); setSubmitting(false);
    } catch { setError("Network error during enrollment"); setSubmitting(false); }
  }

  async function disableTwoFactor() {
    setError(null); setSubmitting(true);
    try {
      const res = await fetch("/api/admin/2fa/disable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: disablePassword, totpCode: disableTotpCode }) });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? "Failed to disable 2FA"); setSubmitting(false); return; }
      setTwoFactorEnabled(false); setBackupCodesRemaining(0); setDisableTotpCode(""); setDisablePassword(""); setShowDisableForm(false); setSuccess("2FA disabled."); setSubmitting(false);
    } catch { setError("Network error"); setSubmitting(false); }
  }

  async function handlePasswordChange() {
    setError(null); setSuccess(null);
    if (newPassword !== newPasswordConfirm) { setError("New password and confirmation do not match"); return; }
    if (newPassword === currentPassword) { setError("New password must be different from current password"); return; }
    setSubmitting(true);
    try {
      const body: Record<string, string> = { currentPassword, newPassword };
      if (twoFactorEnabled) body.totpCode = passwordTotpCode;
      const res = await fetch("/api/admin/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? "Password change failed"); setSubmitting(false); return; }
      setSuccess("Password changed. Your user ID and all other identity fields are unchanged.");
      setWantPasswordChange(false); setNewPassword(""); setNewPasswordConfirm(""); setPasswordTotpCode(""); setCurrentPassword(""); setSubmitting(false);
    } catch { setError("Network error"); setSubmitting(false); }
  }

  function downloadBackupCodes() {
    if (!backupCodes) return;
    const text = `Planned — 2FA Backup Codes\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join("\n")}\n\nEach code can be used once. Store these securely.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `planned-backup-codes-${new Date().toISOString().split("T")[0]}.txt`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="surface-wood-strong rounded-lg p-6 md:p-8 space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-3"><Lock className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} /><h2 className="font-editorial text-sm text-foreground tracking-wide">Confirm your identity</h2></div>
          <p className="text-[11px] text-foreground/50 mb-3 leading-relaxed">Enter your current password to authorize any changes below.{twoFactorEnabled && <span className="mt-1 block" style={{ color: "var(--primary)" }}>2FA is enabled — you will also need a TOTP code.</span>}</p>
          <div className="relative">
            <input type={showCurrent ? "text" : "password"} required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="input-editorial pr-10" autoComplete="current-password" />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-foreground/40 hover:text-foreground" aria-label={showCurrent ? "Hide" : "Show"}>{showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
          </div>
          {twoFactorEnabled && (
            <div className="mt-3">
              <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5"><Smartphone className="inline h-3 w-3 mr-1" /> 2FA Code (required for changes)</label>
              <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} className="input-editorial text-center text-base tracking-[0.3em] font-mono" placeholder="000000" maxLength={6} autoComplete="one-time-code" inputMode="numeric" disabled={!wantsChange} />
            </div>
          )}
        </section>
        <div className="divider-gold" />
        <section>
          <label className="flex items-center gap-2 cursor-pointer mb-3"><input type="checkbox" checked={wantEmailChange} onChange={(e) => setWantEmailChange(e.target.checked)} className="h-3.5 w-3.5" /><Mail className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} /><span className="font-editorial text-sm text-foreground tracking-wide">Change founder email</span></label>
          {wantEmailChange && (
            <div className="pl-6 border-l border-[var(--hairline-strong)]">
              <p className="text-[11px] text-foreground/50 mb-2">Current: <span className="font-mono text-foreground/70">{currentEmail}</span></p>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new-email@example.com" className="input-editorial" autoComplete="email" />
              <p className="text-[10px] text-foreground/40 mt-2">Your session token will be re-issued.{twoFactorEnabled && " A valid 2FA code is required above."}</p>
            </div>
          )}
        </section>
        <div className="divider-gold" />
        <section>
          <label className="flex items-center gap-2 cursor-pointer mb-3"><input type="checkbox" checked={wantQChange} onChange={(e) => setWantQChange(e.target.checked)} className="h-3.5 w-3.5" /><ShieldQuestion className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} /><span className="font-editorial text-sm text-foreground tracking-wide">Change security question</span></label>
          {wantQChange && (
            <div className="pl-6 border-l border-[var(--hairline-strong)] space-y-3">
              <div><label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">New question</label><input type="text" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} className="input-editorial" list="suggested-questions-security" /><datalist id="suggested-questions-security">{SUGGESTED_QUESTIONS.map((q) => <option key={q} value={q} />)}</datalist></div>
              <div><label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">New answer</label><input type="text" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} className="input-editorial" autoComplete="off" /></div>
            </div>
          )}
        </section>
        {error && <div className="p-3 rounded text-xs" style={{ background: "color-mix(in srgb, var(--chart-3) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--chart-3) 40%, transparent)", color: "var(--chart-3)" }}>{error}</div>}
        {success && <div className="p-3 rounded text-xs" style={{ background: "color-mix(in srgb, var(--chart-2) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--chart-2) 40%, transparent)", color: "var(--chart-2)" }}><Check className="inline h-3 w-3 mr-1" />{success}</div>}
        <button type="submit" disabled={!canSubmit || submitting} className="btn-gold w-full px-6 py-3 rounded text-sm tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">{submitting ? "Updating…" : <>Save Changes <ArrowRight className="h-4 w-4" /></>}</button>
      </form>

      {/* 2FA Management */}
      <div className="surface-wood-strong rounded-lg p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4"><Smartphone className="h-4 w-4" style={{ color: "var(--primary)" }} /><h2 className="font-editorial text-sm text-foreground tracking-wide">Two-Factor Authentication</h2><span className="ml-auto px-2 py-0.5 rounded text-[9px] tracking-wider uppercase" style={{ background: twoFactorEnabled ? "color-mix(in srgb, var(--chart-2) 15%, transparent)" : "color-mix(in srgb, var(--chart-3) 15%, transparent)", color: twoFactorEnabled ? "var(--chart-2)" : "var(--chart-3)" }}>{twoFactorEnabled ? "Enabled" : "Not enabled"}</span></div>
        {twoFactorEnabled ? (
          <div>
            <p className="text-[11px] text-foreground/55 leading-relaxed mb-4">2FA is active. Login requires both your password and a 6-digit code from your authenticator app. You have <strong>{backupCodesRemaining}</strong> backup codes remaining.</p>
            {backupCodes && backupCodes.length > 0 && (
              <div className="mb-4 p-4 rounded" style={{ background: "color-mix(in srgb, var(--chart-3) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--chart-3) 30%, transparent)" }}>
                <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-3.5 w-3.5" style={{ color: "var(--chart-3)" }} /><span className="text-[11px] font-medium" style={{ color: "var(--chart-3)" }}>Save these backup codes now — they won&apos;t be shown again</span></div>
                <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">{backupCodes.map((code, i) => <div key={i} className="text-foreground/80">{code}</div>)}</div>
                <button onClick={downloadBackupCodes} className="btn-ghost mt-3 px-3 py-1.5 rounded text-[10px] tracking-wider flex items-center gap-1.5"><Download className="h-3 w-3" /> Download as .txt</button>
              </div>
            )}
            {showDisableForm ? (
              <div className="p-4 rounded" style={{ background: "color-mix(in srgb, var(--chart-3) 5%, transparent)", border: "1px solid var(--hairline-strong)" }}>
                <p className="text-[11px] text-foreground/60 mb-3">To disable 2FA, confirm your password and enter a current TOTP or backup code.</p>
                <input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} className="input-editorial mb-2" placeholder="Current password" autoComplete="current-password" />
                <input type="text" value={disableTotpCode} onChange={(e) => setDisableTotpCode(e.target.value)} className="input-editorial text-center tracking-[0.3em] font-mono mb-3" placeholder="TOTP or backup code" autoComplete="one-time-code" />
                <div className="flex gap-2"><button onClick={disableTwoFactor} disabled={submitting || !disablePassword || !disableTotpCode} className="btn-gold flex-1 px-3 py-2 rounded text-[11px] tracking-wider disabled:opacity-40" style={{ background: "var(--chart-3)" }}>{submitting ? "Disabling…" : "Confirm Disable 2FA"}</button><button onClick={() => { setShowDisableForm(false); setDisableTotpCode(""); setDisablePassword(""); }} className="btn-ghost px-3 py-2 rounded text-[11px] tracking-wider">Cancel</button></div>
              </div>
            ) : <button onClick={() => setShowDisableForm(true)} className="btn-ghost px-3 py-2 rounded text-[11px] tracking-wider" style={{ color: "var(--chart-3)" }}>Disable 2FA</button>}
          </div>
        ) : (
          <div>
            <p className="text-[11px] text-foreground/55 leading-relaxed mb-4">Without 2FA, a stolen password is enough to take over your account. Enroll now to require a 6-digit code from your authenticator app on every login.</p>
            {enrollmentStep === "idle" && <button onClick={startEnrollment} className="btn-gold px-4 py-2 rounded text-[11px] tracking-wider flex items-center gap-2"><Smartphone className="h-3.5 w-3.5" /> Enroll in 2FA</button>}
            {enrollmentStep === "verify" && qrCodeDataUrl && (
              <div>
                <p className="text-[11px] text-foreground/60 mb-3"><strong>Step 1.</strong> Scan this QR code with your authenticator app.</p>
                <div className="flex justify-center mb-4"><img src={qrCodeDataUrl} alt="2FA QR code" width={200} height={200} style={{ borderRadius: 8 }} /></div>
                <details className="mb-4"><summary className="text-[10px] text-foreground/40 cursor-pointer">Can&apos;t scan? Show manual entry key</summary><code className="block mt-2 p-2 rounded text-[10px] font-mono break-all" style={{ background: "var(--background)", color: "var(--foreground)" }}>{totpSecret}</code></details>
                <p className="text-[11px] text-foreground/60 mb-2"><strong>Step 2.</strong> Enter your current password and the 6-digit code from your app:</p>
                <input type="password" value={enrollPassword} onChange={(e) => setEnrollPassword(e.target.value)} className="input-editorial mb-2" placeholder="Current password" autoComplete="current-password" />
                <input type="text" value={enrollTotpCode} onChange={(e) => setEnrollTotpCode(e.target.value)} className="input-editorial text-center tracking-[0.3em] font-mono mb-3" placeholder="000000" maxLength={6} autoComplete="one-time-code" inputMode="numeric" />
                <div className="flex gap-2"><button onClick={completeEnrollment} disabled={submitting || !enrollPassword || enrollTotpCode.length < 6} className="btn-gold flex-1 px-3 py-2 rounded text-[11px] tracking-wider disabled:opacity-40">{submitting ? "Activating…" : "Activate 2FA"}</button><button onClick={() => { setEnrollmentStep("idle"); setTotpSecret(null); setQrCodeDataUrl(null); setEnrollTotpCode(""); setEnrollPassword(""); }} className="btn-ghost px-3 py-2 rounded text-[11px] tracking-wider">Cancel</button></div>
              </div>
            )}
            {enrollmentStep === "backup" && backupCodes && (
              <div className="p-4 rounded" style={{ background: "color-mix(in srgb, var(--chart-2) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--chart-2) 30%, transparent)" }}>
                <div className="flex items-center gap-2 mb-3"><Check className="h-4 w-4" style={{ color: "var(--chart-2)" }} /><span className="text-xs font-medium" style={{ color: "var(--chart-2)" }}>2FA is now active</span></div>
                <p className="text-[11px] text-foreground/60 mb-3">Save these backup codes. Each can be used once if you lose your device.</p>
                <div className="grid grid-cols-2 gap-1 font-mono text-[10px] mb-3">{backupCodes.map((code, i) => <div key={i} className="text-foreground/80">{code}</div>)}</div>
                <button onClick={downloadBackupCodes} className="btn-ghost px-3 py-1.5 rounded text-[10px] tracking-wider flex items-center gap-1.5"><Download className="h-3 w-3" /> Download as .txt</button>
                <button onClick={() => { setEnrollmentStep("idle"); setBackupCodes(null); router.refresh(); }} className="btn-ghost ml-2 px-3 py-1.5 rounded text-[10px] tracking-wider flex items-center gap-1.5"><RefreshCw className="h-3 w-3" /> Done</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Password Change */}
      <div className="surface-wood-strong rounded-lg p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4"><Key className="h-4 w-4" style={{ color: "var(--primary)" }} /><h2 className="font-editorial text-sm text-foreground tracking-wide">Change Password</h2></div>
        <p className="text-[11px] text-foreground/55 leading-relaxed mb-4">Change your founder password. Requires your current password{twoFactorEnabled && " plus a valid 2FA code"}. <strong>Your user ID and all other identity fields remain unchanged.</strong></p>
        {!wantPasswordChange ? (
          <button onClick={() => setWantPasswordChange(true)} className="btn-ghost px-4 py-2 rounded text-[11px] tracking-wider flex items-center gap-2"><Key className="h-3.5 w-3.5" /> Change password</button>
        ) : (
          <div className="space-y-3">
            <div><label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Current password</label><div className="relative"><input type={showNewPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-editorial pr-10" placeholder="Current password" autoComplete="current-password" /><button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-foreground/40 hover:text-foreground" aria-label={showNewPassword ? "Hide" : "Show"}>{showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button></div></div>
            {twoFactorEnabled && <div><label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5"><Smartphone className="inline h-3 w-3 mr-1" /> 2FA code</label><input type="text" value={passwordTotpCode} onChange={(e) => setPasswordTotpCode(e.target.value)} className="input-editorial text-center tracking-[0.3em] font-mono" placeholder="000000" maxLength={6} autoComplete="one-time-code" inputMode="numeric" /></div>}
            <div><label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">New password</label><input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-editorial" placeholder="Min 12 chars, upper + lower + digit" autoComplete="new-password" />{newPassword.length > 0 && <div className="mt-2 flex items-center gap-3"><div className="flex-1 flex gap-1">{[newPassword.length >= 12, /[A-Z]/.test(newPassword), /[a-z]/.test(newPassword), /[0-9]/.test(newPassword)].map((ok, i) => <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: ok ? "var(--chart-2)" : "var(--hairline-strong)" }} />)}</div><span className="text-[10px] text-foreground/40 w-16 text-right">{[newPassword.length >= 12, /[A-Z]/.test(newPassword), /[a-z]/.test(newPassword), /[0-9]/.test(newPassword)].filter(Boolean).length}/4</span></div>}</div>
            <div><label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Confirm new password</label><input type={showNewPassword ? "text" : "password"} value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} className="input-editorial" placeholder="Re-enter new password" autoComplete="new-password" />{newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm && <p className="text-[10px] mt-1.5" style={{ color: "var(--chart-3)" }}>Passwords do not match</p>}</div>
            <div className="flex gap-2 pt-2"><button onClick={handlePasswordChange} disabled={submitting || !currentPassword || !newPassword || newPassword !== newPasswordConfirm || newPassword === currentPassword || (twoFactorEnabled && passwordTotpCode.length < 6)} className="btn-gold flex-1 px-4 py-2 rounded text-[11px] tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">{submitting ? "Changing…" : <><Key className="h-3.5 w-3.5" /> Change Password</>}</button><button onClick={() => { setWantPasswordChange(false); setNewPassword(""); setNewPasswordConfirm(""); setPasswordTotpCode(""); }} className="btn-ghost px-4 py-2 rounded text-[11px] tracking-wider">Cancel</button></div>
            <p className="text-[10px] text-foreground/40 leading-relaxed pt-1"><strong>Identity preservation:</strong> Only your passwordHash field updates. Your user ID, email, role, 2FA enrollment, and all other account data remain unchanged.</p>
          </div>
        )}
      </div>

      <style jsx>{`:global(.input-editorial){width:100%;background:var(--surface-flat);border:1px solid var(--hairline-strong);color:var(--foreground);padding:0.625rem 0.875rem;border-radius:0.375rem;font-size:0.875rem;outline:none;transition:border-color 0.2s;}:global(.input-editorial:focus){border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 15%,transparent);}:global(.input-editorial:disabled){opacity:0.5;cursor:not-allowed;}`}</style>
    </div>
  );
}
