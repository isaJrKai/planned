"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, X, RotateCcw, Download, Trash2, ShieldCheck } from "lucide-react";
import { Button, Field, Input, Select, Textarea, Modal, Notice, api, fieldError } from "@/components/ui";
import { parseMoneyInput, formatMoney } from "@/lib/money";
import { WEEKDAYS } from "@/lib/format";
import { PasswordInput } from "@/components/auth/PasswordInput";

type ApiErr = { code: string; message: string; details?: Record<string, string[]> };
type Member = { id: string; name: string; role: string };
type GoalLite = { id: string; name: string; memberId: string | null };

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<ApiErr | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const run = async <T,>(fn: () => Promise<{ ok: true; data: T } | { ok: false; error: ApiErr }>, onOk?: (d: T) => void) => {
    setBusy(true); setErr(null); setMsg(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) { onOk?.(r.data); router.refresh(); return true; }
    setErr(r.error); return false;
  };
  return { busy, err, msg, setMsg, setErr, run };
}

export function MoneyInput({ currency, name, id, defaultValue, required = true, autoFocus }: { currency: string; name: string; id: string; defaultValue?: string; required?: boolean; autoFocus?: boolean }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-ink-3">{currency}</span>
      <Input id={id} name={name} inputMode="decimal" placeholder="0" className="pl-14 tnum" defaultValue={defaultValue} required={required} autoFocus={autoFocus} autoComplete="off" />
    </div>
  );
}

/* ---------------- Children ---------------- */
export function AddChildButton({ first }: { first?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const a = useAction();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const by = fd.get("birthYear") ? Number(fd.get("birthYear")) : undefined;
    const ok = await a.run(() => api("/api/members", { body: { name: fd.get("name"), username: fd.get("username"), password: fd.get("password"), birthYear: by } }));
    if (ok) setOpen(false);
  }
  return (
    <>
      <Button onClick={() => setOpen(true)} variant={first ? "primary" : "secondary"}><Plus className="h-4 w-4" />Add a child</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a child">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <p className="text-[14px] text-ink-2">They&rsquo;ll get their own spending and savings accounts, and sign in with the username and password you choose here.</p>
          {a.err && !a.err.details && <Notice tone="spend">{a.err.message}</Notice>}
          <Field label="Name" htmlFor="c-name" error={fieldError(a.err ?? undefined, "name")}><Input id="c-name" name="name" required autoFocus /></Field>
          <Field label="Username" htmlFor="c-user" hint="Letters, numbers and underscores. They'll type this to sign in." error={fieldError(a.err ?? undefined, "username")}><Input id="c-user" name="username" required autoComplete="off" /></Field>
          <Field label="Password" htmlFor="c-pw" hint="At least 6 characters. You can reset it any time." error={fieldError(a.err ?? undefined, "password")}><PasswordInput id="c-pw" name="password" required minLength={6} autoComplete="new-password" /></Field>
          <Field label="Birth year (optional)" htmlFor="c-by" hint="Used only to show age; helps pick lesson wording."><Input id="c-by" name="birthYear" inputMode="numeric" placeholder={String(new Date().getFullYear() - 10)} /></Field>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={a.busy}>Add child</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function ResetChildPassword({ memberId, name }: { memberId: string; name: string }) {
  const [open, setOpen] = React.useState(false);
  const a = useAction();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await a.run(() => api(`/api/members/${memberId}`, { method: "PATCH", body: { password: fd.get("password") } }));
    if (ok) { setOpen(false); }
  }
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Reset password</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`New password for ${name}`}>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {a.err && <Notice tone="spend">{a.err.message}</Notice>}
          <Field label="New password" htmlFor="rp" hint="Their other devices will be signed out."><PasswordInput id="rp" name="password" required minLength={6} autoFocus autoComplete="new-password" /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={a.busy}>Set password</Button></div>
        </form>
      </Modal>
    </>
  );
}

/* ---------------- Money into the family ---------------- */
export function DepositButton({ currency, variant = "primary", label = "Add to pool", defaultOpen }: { currency: string; variant?: "primary" | "secondary"; label?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  const a = useAction();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = parseMoneyInput(String(fd.get("amount")), currency);
    if (amount === null || amount <= 0) { a.setErr({ code: "v", message: "Enter a valid amount." }); return; }
    const ok = await a.run(() => api("/api/transactions", { idempotent: true, body: { type: "deposit", amount, note: fd.get("note") || undefined } }));
    if (ok) setOpen(false);
  }
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{label}</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add money to the family pool">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <p className="text-[14px] text-ink-2">The pool is where allowances and approved requests are paid from. This records money you&rsquo;re setting aside for the children — Planned doesn&rsquo;t move real funds.</p>
          {a.err && <Notice tone="spend">{a.err.message}</Notice>}
          <Field label="Amount" htmlFor="d-amt"><MoneyInput currency={currency} id="d-amt" name="amount" autoFocus /></Field>
          <Field label="Note (optional)" htmlFor="d-note"><Input id="d-note" name="note" placeholder="e.g. April allowances" /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={a.busy}>Add</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function GiveButton({ currency, members, memberId }: { currency: string; members: Member[]; memberId?: string }) {
  const [open, setOpen] = React.useState(false);
  const a = useAction();
  const kids = members.filter((m) => m.role === "child");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = parseMoneyInput(String(fd.get("amount")), currency);
    if (amount === null || amount <= 0) { a.setErr({ code: "v", message: "Enter a valid amount." }); return; }
    const ok = await a.run(() => api("/api/transactions", { idempotent: true, body: { type: "give", memberId: fd.get("memberId"), to: fd.get("to"), amount, note: fd.get("note") || undefined } }));
    if (ok) setOpen(false);
  }
  if (!kids.length) return null;
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Give one-off</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Give a one-off amount">
        <form onSubmit={submit} className="space-y-4" noValidate>
          {a.err && <Notice tone="spend">{a.err.message}</Notice>}
          <Field label="To" htmlFor="g-m"><Select id="g-m" name="memberId" defaultValue={memberId ?? kids[0].id}>{kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</Select></Field>
          <Field label="Into" htmlFor="g-to"><Select id="g-to" name="to" defaultValue="spending"><option value="spending">Spending</option><option value="savings">Savings</option></Select></Field>
          <Field label="Amount" htmlFor="g-amt" hint="Comes out of the family pool."><MoneyInput currency={currency} id="g-amt" name="amount" /></Field>
          <Field label="Reason (optional)" htmlFor="g-note"><Input id="g-note" name="note" placeholder="e.g. Birthday" /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={a.busy}>Give</Button></div>
        </form>
      </Modal>
    </>
  );
}

/* ---------------- Allowances ---------------- */
export function AllowanceButton({ currency, members, goals, first }: { currency: string; members: Member[]; goals: GoalLite[]; first?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [cadence, setCadence] = React.useState<"weekly" | "monthly">("weekly");
  const [memberId, setMemberId] = React.useState(members.find((m) => m.role === "child")?.id ?? "");
  const [save, setSave] = React.useState(20);
  const [goalPct, setGoalPct] = React.useState(0);
  const a = useAction();
  const kids = members.filter((m) => m.role === "child");
  const memberGoals = goals.filter((g) => g.memberId === memberId);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = parseMoneyInput(String(fd.get("amount")), currency) ?? 0;
    if (!amount) { a.setErr({ code: "v", message: "Enter a valid amount." }); return; }
    const goalId = fd.get("goalId") ? String(fd.get("goalId")) : null;
    const ok = await a.run(() => api("/api/allowances", { body: { memberId, amount, cadence, dayOfPeriod: Number(fd.get("day")), savePercent: save, goalPercent: goalId ? goalPct : 0, goalId } }));
    if (ok) setOpen(false);
  }
  if (!kids.length) return null;
  const spend = Math.max(0, 100 - save - (memberGoals.length ? goalPct : 0));
  return (
    <>
      <Button variant={first ? "primary" : "secondary"} onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New allowance</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Set up an allowance">
        <form onSubmit={submit} className="space-y-4" noValidate>
          {a.err && <Notice tone="spend">{a.err.message}</Notice>}
          <Field label="For" htmlFor="al-m"><Select id="al-m" value={memberId} onChange={(e) => setMemberId(e.target.value)}>{kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</Select></Field>
          <Field label="Amount" htmlFor="al-amt"><MoneyInput currency={currency} id="al-amt" name="amount" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="How often" htmlFor="al-c"><Select id="al-c" value={cadence} onChange={(e) => setCadence(e.target.value as "weekly" | "monthly")}><option value="weekly">Every week</option><option value="monthly">Every month</option></Select></Field>
            <Field label={cadence === "weekly" ? "On" : "On day"} htmlFor="al-d">
              <Select id="al-d" name="day" defaultValue={cadence === "weekly" ? 6 : 1}>
                {cadence === "weekly" ? WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>) : Array.from({ length: 28 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </Select>
            </Field>
          </div>
          <fieldset className="border border-line rounded-md p-4 space-y-3">
            <legend className="px-1 text-[13.5px] font-medium text-ink-2">How it&rsquo;s split</legend>
            <label className="block text-[14px]"><span className="flex justify-between"><span>To savings</span><span className="tnum text-ink-2">{save}%</span></span><input type="range" min={0} max={100 - goalPct} value={save} onChange={(e) => setSave(Number(e.target.value))} className="w-full accent-[#1a8a4a]" aria-label="Percent to savings" /></label>
            {memberGoals.length > 0 && (
              <>
                <Field label="Toward a goal" htmlFor="al-g"><Select id="al-g" name="goalId" defaultValue=""><option value="">No goal</option>{memberGoals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></Field>
                <label className="block text-[14px]"><span className="flex justify-between"><span>To that goal</span><span className="tnum text-ink-2">{goalPct}%</span></span><input type="range" min={0} max={100 - save} value={goalPct} onChange={(e) => setGoalPct(Number(e.target.value))} className="w-full accent-[#c47a09]" aria-label="Percent to goal" /></label>
              </>
            )}
            <p className="text-[13.5px] text-ink-2">Spending gets the rest: <strong className="text-ink tnum">{spend}%</strong>.</p>
          </fieldset>
          <p className="text-[13px] text-ink-3">Paid automatically from the family pool on the day you chose. You can also pay early from the Allowances page — never twice in one period.</p>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={a.busy}>Create</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function AllowanceRowActions({ id, active }: { id: string; active: boolean }) {
  const a = useAction();
  return (
    <div className="flex items-center gap-2">
      {a.msg && <span className="text-[13px] text-save">{a.msg}</span>}
      {a.err && <span className="text-[13px] text-spend">{a.err.message}</span>}
      {active && <Button size="sm" variant="secondary" loading={a.busy} onClick={() => a.run(() => api<{ message: string }>(`/api/allowances/${id}/pay`, { method: "POST" }), (d) => a.setMsg(d.message))}>Pay now</Button>}
      <Button size="sm" variant="ghost" loading={a.busy} onClick={() => a.run(() => api(`/api/allowances/${id}`, { method: "PATCH", body: { active: !active } }))}>{active ? "Pause" : "Resume"}</Button>
    </div>
  );
}

/* ---------------- Goals ---------------- */
export function GoalButton({ currency, members, forMemberId, allowShared, first, childMode }: { currency: string; members: Member[]; forMemberId?: string; allowShared?: boolean; first?: boolean; childMode?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const a = useAction();
  const kids = members.filter((m) => m.role === "child");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const target = parseMoneyInput(String(fd.get("target")), currency);
    if (!target) { a.setErr({ code: "v", message: "Enter a valid target amount." }); return; }
    const owner = String(fd.get("memberId") ?? forMemberId ?? "");
    const isShared = owner === "__shared";
    const date = fd.get("date") ? new Date(String(fd.get("date"))).toISOString() : null;
    const ok = await a.run(() => api("/api/goals", { body: { memberId: isShared ? null : owner || undefined, name: fd.get("name"), targetAmount: target, targetDate: date, isShared } }));
    if (ok) setOpen(false);
  }
  return (
    <>
      <Button variant={first ? "primary" : "secondary"} onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{childMode ? "New goal" : "Create goal"}</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={childMode ? "What are you saving for?" : "Create a goal"}>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {a.err && !a.err.details && <Notice tone="spend">{a.err.message}</Notice>}
          {!forMemberId && !childMode && (
            <Field label="Whose goal" htmlFor="go-m"><Select id="go-m" name="memberId" defaultValue={kids[0]?.id ?? "__shared"}>{kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}{allowShared && <option value="__shared">Shared family goal</option>}</Select></Field>
          )}
          <Field label="Name" htmlFor="go-n" error={fieldError(a.err ?? undefined, "name")}><Input id="go-n" name="name" placeholder={childMode ? "e.g. New bicycle" : "e.g. Bicycle, Holiday fund"} required autoFocus /></Field>
          <Field label="Target" htmlFor="go-t"><MoneyInput currency={currency} id="go-t" name="target" /></Field>
          <Field label="Hoping to reach it by (optional)" htmlFor="go-d"><Input id="go-d" name="date" type="date" /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={a.busy}>{childMode ? "Start saving" : "Create goal"}</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function ContributeButton({ goalId, goalName, currency, sources, size = "md", variant = "primary" }: { goalId: string; goalName: string; currency: string; sources: { key: "spending" | "savings" | "family_pool"; label: string; balance: number }[]; size?: "sm" | "md"; variant?: "primary" | "secondary" }) {
  const [open, setOpen] = React.useState(false);
  const a = useAction();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = parseMoneyInput(String(fd.get("amount")), currency);
    if (!amount) { a.setErr({ code: "v", message: "Enter a valid amount." }); return; }
    const ok = await a.run(() => api(`/api/goals/${goalId}/contribute`, { idempotent: true, body: { amount, from: fd.get("from") } }));
    if (ok) setOpen(false);
  }
  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)}>Add to goal</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Save toward ${goalName}`}>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {a.err && <Notice tone="spend">{a.err.message}</Notice>}
          <Field label="From" htmlFor="ct-f"><Select id="ct-f" name="from" defaultValue={sources[0]?.key}>{sources.map((s) => <option key={s.key} value={s.key}>{s.label} · {formatMoney(s.balance, currency)}</option>)}</Select></Field>
          <Field label="Amount" htmlFor="ct-a"><MoneyInput currency={currency} id="ct-a" name="amount" autoFocus /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={a.busy}>Save it</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function ArchiveGoalButton({ goalId, hasMoney }: { goalId: string; hasMoney: boolean }) {
  const a = useAction();
  const [confirm, setConfirm] = React.useState(false);
  if (!confirm) return <Button size="sm" variant="ghost" onClick={() => setConfirm(true)}>Close goal</Button>;
  return (
    <div className="flex items-center gap-2 text-[13.5px]">
      <span className="text-ink-2">{hasMoney ? "Saved money goes back to savings." : "Close this goal?"}</span>
      <Button size="sm" variant="danger" loading={a.busy} onClick={() => a.run(() => api(`/api/goals/${goalId}`, { method: "PATCH", body: { status: "archived" } }))}>Close</Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>Keep</Button>
    </div>
  );
}

/* ---------------- Approvals ---------------- */
export function ApprovalActions({ id }: { id: string }) {
  const a = useAction();
  const [note, setNote] = React.useState("");
  return (
    <div className="space-y-2">
      {a.err && <Notice tone="spend">{a.err.message}</Notice>}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" loading={a.busy} onClick={() => a.run(() => api(`/api/approvals/${id}`, { body: { decision: "approved", note: note || undefined } }))}><Check className="h-4 w-4" />Approve</Button>
        <Button size="sm" variant="secondary" loading={a.busy} onClick={() => a.run(() => api(`/api/approvals/${id}`, { body: { decision: "declined", note: note || undefined } }))}><X className="h-4 w-4" />Decline</Button>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for them (optional)" className="flex-1 min-w-[180px] h-8 px-2.5 text-[13.5px] rounded-md border border-line bg-paper focus:border-brand focus:outline-none" aria-label="Note" />
      </div>
    </div>
  );
}

/* ---------------- Transactions ---------------- */
export function ReverseButton({ id }: { id: string }) {
  const a = useAction();
  const [open, setOpen] = React.useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await a.run(() => api(`/api/transactions/${id}/reverse`, { body: { reason: fd.get("reason") } }));
    if (ok) setOpen(false);
  }
  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[13px] text-ink-3 hover:text-ink inline-flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" />Reverse</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Reverse this transaction">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <p className="text-[14px] text-ink-2">An equal and opposite entry is added. The original stays in the ledger, marked as reversed.</p>
          {a.err && <Notice tone="spend">{a.err.message}</Notice>}
          <Field label="Why" htmlFor="rv-r"><Input id="rv-r" name="reason" required autoFocus placeholder="e.g. Entered twice by mistake" /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="danger" loading={a.busy}>Reverse</Button></div>
        </form>
      </Modal>
    </>
  );
}

/* ---------------- Settings ---------------- */
export function RulesForm({ currency, rules }: { currency: string; rules: { minSavePercent: number; approvalThreshold: number; dailySpendLimit: number; goalWithdrawalNeedsApproval: boolean } }) {
  const a = useAction();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await a.run(() => api("/api/rules", { method: "PATCH", body: {
      minSavePercent: Number(fd.get("minSave")),
      approvalThreshold: parseMoneyInput(String(fd.get("threshold") || "0"), currency) ?? 0,
      dailySpendLimit: parseMoneyInput(String(fd.get("daily") || "0"), currency) ?? 0,
      goalWithdrawalNeedsApproval: fd.get("gw") === "on",
    } }), () => a.setMsg("Rules saved."));
  }
  const major = (n: number) => (n ? String(n / Math.pow(10, currency === "UGX" || currency === "KES" || currency === "TZS" || currency === "RWF" ? 0 : 2)) : "");
  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg" noValidate>
      {a.err && <Notice tone="spend">{a.err.message}</Notice>}{a.msg && <Notice tone="save">{a.msg}</Notice>}
      <Field label="Purchases above this amount need your approval" htmlFor="r-t" hint="Leave empty for no threshold."><MoneyInput currency={currency} id="r-t" name="threshold" defaultValue={major(rules.approvalThreshold)} required={false} /></Field>
      <Field label="Daily spending limit per child" htmlFor="r-d" hint="Leave empty for no limit."><MoneyInput currency={currency} id="r-d" name="daily" defaultValue={major(rules.dailySpendLimit)} required={false} /></Field>
      <Field label="Suggested minimum saving rate" htmlFor="r-s" hint="Shown to children as a guide when they set up their split."><Input id="r-s" name="minSave" type="number" min={0} max={100} defaultValue={rules.minSavePercent} className="w-28" /></Field>
      <label className="flex items-start gap-3 text-[14.5px]"><input type="checkbox" name="gw" defaultChecked={rules.goalWithdrawalNeedsApproval} className="mt-1 accent-[#1f5eff]" /><span>Taking money out of a goal needs a parent&rsquo;s approval<span className="block text-[13px] text-ink-3">Recommended. Keeps goals feeling real.</span></span></label>
      <Button type="submit" loading={a.busy}>Save rules</Button>
    </form>
  );
}

export function PasswordForm() {
  const a = useAction();
  return (
    <form onSubmit={async (e) => { e.preventDefault(); const f = e.currentTarget; const fd = new FormData(f); const ok = await a.run(() => api<{ message: string }>("/api/auth/password", { method: "PATCH", body: { current: fd.get("current"), next: fd.get("next") } }), (d) => a.setMsg(d.message)); if (ok) f.reset(); }} className="space-y-4 max-w-sm" noValidate>
      {a.err && <Notice tone="spend">{a.err.message}</Notice>}{a.msg && <Notice tone="save">{a.msg}</Notice>}
      <Field label="Current password" htmlFor="pw-c"><PasswordInput id="pw-c" name="current" required autoComplete="current-password" /></Field>
      <Field label="New password" htmlFor="pw-n" hint="At least 10 characters."><PasswordInput id="pw-n" name="next" required minLength={10} autoComplete="new-password" /></Field>
      <Button type="submit" variant="secondary" loading={a.busy}>Change password</Button>
    </form>
  );
}

export function SessionsPanel() {
  const a = useAction();
  const [rows, setRows] = React.useState<{ id: string; current: boolean; lastSeenAt: string; ip: string | null; userAgent: string | null }[] | null>(null);
  const load = React.useCallback(async () => { const r = await api<typeof rows>("/api/auth/sessions", { method: "GET" }); if (r.ok) setRows(r.data); }, []);
  React.useEffect(() => { load(); }, [load]);
  return (
    <div className="space-y-3 max-w-lg">
      {rows === null ? <div className="space-y-2"><div className="skeleton h-10" /><div className="skeleton h-10" /></div> : (
        <ul className="divide-y divide-line border border-line rounded-md">
          {rows.map((s) => <li key={s.id} className="px-3 py-2.5 text-[14px] flex items-center justify-between gap-3"><span className="truncate"><span className="font-medium">{s.current ? "This device" : "Another device"}</span><span className="text-ink-3"> · {s.ip ?? "unknown IP"} · {(s.userAgent ?? "").split(")")[0].slice(0, 40)}</span></span><span className="text-[13px] text-ink-3 shrink-0">{new Date(s.lastSeenAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></li>)}
        </ul>
      )}
      {a.msg && <Notice tone="save">{a.msg}</Notice>}
      <Button variant="secondary" size="sm" loading={a.busy} onClick={() => a.run(() => api<{ message: string }>("/api/auth/sessions", { method: "DELETE" }), (d) => { a.setMsg(d.message); load(); })}>Sign out everywhere else</Button>
    </div>
  );
}

export function AiSettingsForm({ initial }: { initial: { enabled: boolean; baseUrl: string; model: string; keyMasked: string | null; source: string } }) {
  const a = useAction();
  const [test, setTest] = React.useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const key = String(fd.get("apiKey") ?? "");
    await a.run(() => api("/api/settings/ai", { method: "PATCH", body: { enabled: fd.get("enabled") === "on", baseUrl: fd.get("baseUrl") || null, model: fd.get("model") || null, ...(key ? { apiKey: key } : {}) } }), () => a.setMsg("Saved."));
  }
  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg" noValidate>
      <p className="text-[14.5px] text-ink-2">Planned can write short, plain explanations of your family&rsquo;s numbers using a language model you connect. It only ever sees aggregate figures and first names, and it cannot move money or change anything.</p>
      {a.err && <Notice tone="spend">{a.err.message}</Notice>}{a.msg && <Notice tone="save">{a.msg}</Notice>}
      <label className="flex items-center gap-3 text-[14.5px]"><input type="checkbox" name="enabled" defaultChecked={initial.enabled} className="accent-[#1f5eff]" />Enable written explanations</label>
      <Field label="Provider endpoint" htmlFor="ai-u" hint="Any OpenAI-compatible chat completions API."><Input id="ai-u" name="baseUrl" defaultValue={initial.baseUrl} placeholder="https://api.openai.com/v1" /></Field>
      <Field label="Model" htmlFor="ai-m"><Input id="ai-m" name="model" defaultValue={initial.model} placeholder="gpt-4o-mini" /></Field>
      <Field label="API key" htmlFor="ai-k" hint={initial.keyMasked ? `A key is saved (${initial.keyMasked}, from ${initial.source === "family" ? "your settings" : "the server"}). Enter a new one to replace it.` : "No key yet. Explanations will use fixed rules until you add one."}>
        <PasswordInput id="ai-k" name="apiKey" autoComplete="off" placeholder="Paste a key" />
      </Field>
      <div className="flex flex-wrap gap-2 items-center">
        <Button type="submit" loading={a.busy}>Save</Button>
        <Button type="button" variant="secondary" onClick={async () => { setTest("Testing…"); const r = await api<{ text: string; source: string }>("/api/settings/ai/test"); setTest(r.ok ? `${r.data.source === "model" ? "Connected" : "Using fallback rules"}: ${r.data.text}` : r.error.message); }}>Test connection</Button>
        {initial.keyMasked && initial.source === "family" && <Button type="button" variant="ghost" onClick={() => a.run(() => api("/api/settings/ai", { method: "PATCH", body: { apiKey: null } }), () => a.setMsg("Key removed."))}>Remove key</Button>}
      </div>
      {test && <Notice>{test}</Notice>}
    </form>
  );
}

export function DataSection({ familyName }: { familyName: string }) {
  const a = useAction();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-start gap-3">
        <Download className="h-5 w-5 text-ink-3 mt-0.5" />
        <div><p className="font-medium">Export everything</p><p className="text-[14px] text-ink-2">Members, accounts, every transaction, goals, allowances, lessons, journal and the audit trail, as one JSON file.</p><a href="/api/account/export" className="inline-flex mt-2 h-9 px-3.5 items-center rounded-md border border-line-strong text-[14px] font-medium hover:bg-warm">Download export</a></div>
      </div>
      <div className="flex items-start gap-3">
        <Trash2 className="h-5 w-5 text-spend mt-0.5" />
        <div><p className="font-medium">Delete the family</p><p className="text-[14px] text-ink-2">Removes every member, account, transaction, goal, lesson and journal entry immediately. This cannot be undone.</p><Button variant="secondary" size="sm" className="mt-2 text-spend border-spend/30 hover:bg-spend-soft" onClick={() => setOpen(true)}>Delete {familyName}…</Button></div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete the family">
        <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); await a.run(() => api<{ redirect: string }>("/api/account/delete", { body: { password: fd.get("password"), confirm: fd.get("confirm") } }), (d) => router.push(d.redirect)); }} className="space-y-4" noValidate>
          <Notice tone="spend">This deletes everything for every member, including the children&rsquo;s accounts. Consider exporting first.</Notice>
          {a.err && <Notice tone="spend">{a.err.message}</Notice>}
          <Field label="Your password" htmlFor="del-p"><PasswordInput id="del-p" name="password" required autoComplete="current-password" /></Field>
          <Field label="Type DELETE to confirm" htmlFor="del-c"><Input id="del-c" name="confirm" required autoComplete="off" /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="danger" loading={a.busy}>Delete permanently</Button></div>
        </form>
      </Modal>
    </div>
  );
}

/* ---------------- Embedded coach ---------------- */
export function ExplainBox({ topic, question, prompt = "Why?" }: { topic: "pulse" | "goal" | "spending"; question: string; prompt?: string }) {
  const [state, setState] = React.useState<{ text?: string; source?: string; busy?: boolean; err?: string }>({});
  return (
    <div className="mt-3">
      {!state.text && !state.busy && <button className="text-[14px] font-medium text-brand hover:underline" onClick={async () => { setState({ busy: true }); const r = await api<{ text: string; source: string }>("/api/insights/explain", { body: { topic, question } }); setState(r.ok ? { text: r.data.text, source: r.data.source } : { err: r.error.message }); }}>{prompt}</button>}
      {state.busy && <div className="space-y-1.5"><div className="skeleton h-4 w-5/6" /><div className="skeleton h-4 w-3/6" /></div>}
      {state.err && <p className="text-[13.5px] text-spend">{state.err}</p>}
      {state.text && <div className="rise border-l-2 border-line-strong pl-3 text-[14.5px] text-ink-2 leading-relaxed"><p>{state.text}</p>{state.source === "fallback" && <p className="text-[12.5px] text-ink-4 mt-1 inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Generated from fixed rules. Connect a provider in Settings for richer explanations.</p>}</div>}
    </div>
  );
}

export function ReconcileBadge() {
  const [r, setR] = React.useState<{ issues: unknown[]; accounts: unknown[] } | null>(null);
  React.useEffect(() => { api<{ issues: unknown[]; accounts: unknown[] }>("/api/reconcile", { method: "GET" }).then((x) => x.ok && setR(x.data)); }, []);
  if (!r) return <span className="text-[13px] text-ink-3">Checking ledger…</span>;
  return r.issues.length ? <span className="text-[13px] text-spend font-medium">Ledger mismatch on {r.issues.length} account(s) — contact support.</span> : <span className="text-[13px] text-save inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />Ledger and balances reconcile across {r.accounts.length} accounts.</span>;
}

export function InlineTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <Textarea {...props} />; }
