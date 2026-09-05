"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Field, Input, Select, Notice, api, fieldError } from "@/components/ui";
import { PasswordInput } from "./PasswordInput";

type Err = { code: string; message: string; details?: Record<string, string[]> } | null;

export function LoginForm() {
  const router = useRouter();
  const [err, setErr] = React.useState<Err>(null);
  const [busy, setBusy] = React.useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(null);
    const fd = new FormData(e.currentTarget);
    const r = await api<{ redirect: string }>("/api/auth/login", { body: { identifier: fd.get("identifier"), password: fd.get("password") } });
    if (r.ok) { router.push(r.data.redirect); router.refresh(); } else { setErr(r.error); setBusy(false); }
  }
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <h1 className="text-[28px] font-semibold leading-tight">Welcome back</h1>
        <p className="text-ink-2 mt-1">Let&rsquo;s see how your family is doing.</p>
      </div>
      {err && !err.details && <Notice tone="spend">{err.message}</Notice>}
      <Field label="Email or username" htmlFor="identifier" error={fieldError(err ?? undefined, "identifier")}>
        <Input id="identifier" name="identifier" autoComplete="username" autoFocus required inputMode="email" />
      </Field>
      <Field label="Password" htmlFor="password" error={fieldError(err ?? undefined, "password")}>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={busy}>Sign in</Button>
      <p className="text-center text-[14px]"><Link href="/forgot-password" className="text-ink-2 hover:text-ink underline underline-offset-2">Forgot password?</Link></p>
      <hr className="border-line" />
      <p className="text-center text-[14.5px] text-ink-2">New to Planned? <Link href="/signup" className="font-medium text-brand hover:underline">Create your family</Link></p>
      <p className="text-center text-[13px] text-ink-3">Children sign in here too, with the username a parent set up.</p>
    </form>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [err, setErr] = React.useState<Err>(null);
  const [busy, setBusy] = React.useState(false);
  const [pw, setPw] = React.useState("");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(null);
    const fd = new FormData(e.currentTarget);
    const r = await api<{ redirect: string }>("/api/auth/signup", { body: Object.fromEntries(fd.entries()) });
    if (r.ok) { router.push(r.data.redirect); router.refresh(); } else { setErr(r.error); setBusy(false); }
  }
  const strength = pw.length >= 14 ? "Strong" : pw.length >= 10 ? "Good" : pw.length > 0 ? "Too short" : "";
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <h1 className="text-[28px] font-semibold leading-tight">Create your family</h1>
        <p className="text-ink-2 mt-1">You&rsquo;re the parent account. You&rsquo;ll add children next.</p>
      </div>
      {err && !err.details && <Notice tone="spend">{err.message}</Notice>}
      <Field label="Your name" htmlFor="parentName" error={fieldError(err ?? undefined, "parentName")}>
        <Input id="parentName" name="parentName" autoComplete="given-name" autoFocus required />
      </Field>
      <Field label="Family name" htmlFor="familyName" hint="How it'll appear to everyone, e.g. “The Kato family”." error={fieldError(err ?? undefined, "familyName")}>
        <Input id="familyName" name="familyName" required />
      </Field>
      <Field label="Email" htmlFor="email" error={fieldError(err ?? undefined, "email")}>
        <Input id="email" name="email" type="email" autoComplete="email" required inputMode="email" />
      </Field>
      <Field label="Password" htmlFor="password" hint={strength ? `${strength} · at least 10 characters` : "At least 10 characters. A short sentence works well."} error={fieldError(err ?? undefined, "password")}>
        <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={10} value={pw} onChange={(e) => setPw(e.target.value)} />
      </Field>
      <Field label="Currency" htmlFor="currency">
        <Select id="currency" name="currency" defaultValue="UGX">
          {["UGX", "KES", "TZS", "RWF", "USD", "EUR", "GBP"].map((c) => <option key={c}>{c}</option>)}
        </Select>
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={busy}>Create family</Button>
      <p className="text-[13px] text-ink-3 text-center">By continuing you agree to the <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>, including how we handle <Link href="/privacy#children" className="underline">children&rsquo;s data</Link>.</p>
      <hr className="border-line" />
      <p className="text-center text-[14.5px] text-ink-2">Already have a family? <Link href="/login" className="font-medium text-brand hover:underline">Sign in</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const [state, setState] = React.useState<{ msg?: string; devLink?: string; err?: string }>({});
  const [busy, setBusy] = React.useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const fd = new FormData(e.currentTarget);
    const r = await api<{ message: string; devLink?: string }>("/api/auth/forgot", { body: { email: fd.get("email") } });
    setBusy(false);
    if (r.ok) setState({ msg: r.data.message, devLink: r.data.devLink }); else setState({ err: r.error.message });
  }
  if (state.msg) return (
    <div className="space-y-4">
      <h1 className="text-[28px] font-semibold leading-tight">Check your email</h1>
      <p className="text-ink-2">{state.msg}</p>
      {state.devLink && <Notice tone="goal">No email provider is configured in this environment, so here is your link: <a className="underline break-all" href={state.devLink}>{state.devLink}</a></Notice>}
      <Link href="/login" className="inline-block text-[14.5px] text-brand font-medium hover:underline">Back to sign in</Link>
    </div>
  );
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <h1 className="text-[28px] font-semibold leading-tight">Reset your password</h1>
        <p className="text-ink-2 mt-1">Enter the email on the parent account and we&rsquo;ll send a link.</p>
      </div>
      {state.err && <Notice tone="spend">{state.err}</Notice>}
      <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" autoFocus required /></Field>
      <Button type="submit" size="lg" className="w-full" loading={busy}>Send reset link</Button>
      <p className="text-center text-[14px] text-ink-3">Children: ask a parent to reset your password from the Children page.</p>
      <p className="text-center text-[14.5px]"><Link href="/login" className="text-ink-2 hover:text-ink underline underline-offset-2">Back to sign in</Link></p>
    </form>
  );
}

export function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = React.useState<{ msg?: string; err?: string }>({});
  const [busy, setBusy] = React.useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const fd = new FormData(e.currentTarget);
    if (fd.get("password") !== fd.get("confirm")) { setState({ err: "Those passwords don't match." }); setBusy(false); return; }
    const r = await api<{ message: string }>("/api/auth/reset", { body: { token, password: fd.get("password") } });
    setBusy(false);
    if (r.ok) setState({ msg: r.data.message }); else setState({ err: r.error.message });
  }
  if (!token) return <Notice tone="spend">This reset link is missing its token. <Link href="/forgot-password" className="underline">Request a new one</Link>.</Notice>;
  if (state.msg) return (
    <div className="space-y-4">
      <h1 className="text-[28px] font-semibold leading-tight">Password updated</h1>
      <p className="text-ink-2">{state.msg}</p>
      <Button href="/login" size="lg">Sign in</Button>
    </div>
  );
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <h1 className="text-[28px] font-semibold leading-tight">Choose a new password</h1>
      {state.err && <Notice tone="spend">{state.err}</Notice>}
      <Field label="New password" htmlFor="password" hint="At least 10 characters."><PasswordInput id="password" name="password" autoComplete="new-password" required minLength={10} autoFocus /></Field>
      <Field label="Confirm new password" htmlFor="confirm"><PasswordInput id="confirm" name="confirm" autoComplete="new-password" required /></Field>
      <Button type="submit" size="lg" className="w-full" loading={busy}>Update password</Button>
    </form>
  );
}
