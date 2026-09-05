"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, HelpCircle, X } from "lucide-react";
import { Button, Field, Input, Select, Textarea, Modal, Notice, api, cx } from "@/components/ui";
import { parseMoneyInput, formatMoney } from "@/lib/money";
import { MoneyInput } from "@/components/app/Actions";
import type { Lesson } from "@/lib/lessons";

type ApiErr = { code: string; message: string; details?: Record<string, string[]> };
function useAction() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<ApiErr | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const run = async <T,>(fn: () => Promise<{ ok: true; data: T } | { ok: false; error: ApiErr }>, onOk?: (d: T) => void) => {
    setBusy(true); setErr(null); setMsg(null);
    const r = await fn(); setBusy(false);
    if (r.ok) { onOk?.(r.data); router.refresh(); return true; }
    setErr(r.error); return false;
  };
  return { busy, err, msg, setMsg, setErr, run };
}
const CATEGORIES = ["Food", "Education", "Entertainment", "Transport", "Clothing", "Gifts", "Other"];
function guessCategory(desc: string) {
  const d = desc.toLowerCase();
  const map: [RegExp, string][] = [[/lunch|snack|food|drink|soda|chapati|rolex|sweet/, "Food"], [/book|pen|notebook|school|exam|class/, "Education"], [/game|football|movie|music|airtime|data|toy/, "Entertainment"], [/taxi|boda|bus|fare|transport/, "Transport"], [/shoe|shirt|dress|cloth|jacket/, "Clothing"], [/gift|present|birthday/, "Gifts"]];
  return map.find(([r]) => r.test(d))?.[1] ?? "";
}

export function SpendButton({ memberId, currency, spendingBalance, approvalThreshold }: { memberId: string; currency: string; spendingBalance: number; approvalThreshold: number }) {
  const [open, setOpen] = React.useState(false);
  const [desc, setDesc] = React.useState("");
  const [cat, setCat] = React.useState("");
  const [now, setNow] = React.useState<"need" | "want" | "unsure" | "">("");
  const [amt, setAmt] = React.useState("");
  const a = useAction();
  const amount = parseMoneyInput(amt, currency) ?? 0;
  const needsApproval = approvalThreshold > 0 && amount > approvalThreshold;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!amount) { a.setErr({ code: "v", message: "How much was it?" }); return; }
    const ok = await a.run(() => api<{ requiresApproval?: boolean }>("/api/transactions", { idempotent: true, body: { type: "spend", memberId, amount, description: desc, category: cat || "Other", needOrWant: now || undefined } }), (d) => { if (d.requiresApproval) a.setMsg("Sent to your parent to approve."); });
    if (ok) { setOpen(false); setDesc(""); setCat(""); setNow(""); setAmt(""); }
  }
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>I spent money</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Record what you spent">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <p className="text-[14px] text-ink-2">You have {formatMoney(spendingBalance, currency)} to spend.</p>
          {a.err && <Notice tone="spend">{a.err.message}</Notice>}
          <Field label="What was it?" htmlFor="sp-d"><Input id="sp-d" value={desc} onChange={(e) => { setDesc(e.target.value); if (!cat) setCat(guessCategory(e.target.value)); }} placeholder="e.g. School lunch" required autoFocus /></Field>
          <Field label="How much?" htmlFor="sp-a"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-ink-3">{currency}</span><Input id="sp-a" value={amt} onChange={(e) => setAmt(e.target.value)} inputMode="decimal" className="pl-14 tnum" placeholder="0" /></div></Field>
          <Field label="Category" htmlFor="sp-c" hint={cat && guessCategory(desc) === cat ? "We guessed this from what you typed — change it if we're wrong." : undefined}><Select id="sp-c" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Choose…</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <fieldset><legend className="text-[13.5px] font-medium text-ink-2 mb-1.5">Was this a need or a want?</legend>
            <div className="flex gap-2">{(["need", "want", "unsure"] as const).map((k) => <button type="button" key={k} onClick={() => setNow(k)} className={cx("h-9 px-3.5 rounded-md border text-[14px] capitalize", now === k ? "border-ink bg-ink text-white" : "border-line-strong hover:bg-warm")}>{k === "unsure" ? "Not sure" : k}</button>)}</div>
            {now === "want" && <p className="text-[13px] text-ink-3 mt-1.5">Wants are fine. Just worth noticing.</p>}
          </fieldset>
          {needsApproval && <Notice tone="goal">Over {formatMoney(approvalThreshold, currency)}, so this will go to a parent to approve first.</Notice>}
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={a.busy}>{needsApproval ? "Ask to spend" : "Record"}</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function MoveToSavingsButton({ memberId, currency, spendingBalance, savingsBalance }: { memberId: string; currency: string; spendingBalance: number; savingsBalance: number }) {
  const [open, setOpen] = React.useState(false);
  const [dir, setDir] = React.useState<"save" | "unsave">("save");
  const a = useAction();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = parseMoneyInput(String(fd.get("amount")), currency);
    if (!amount) { a.setErr({ code: "v", message: "Enter an amount." }); return; }
    const ok = await a.run(() => api("/api/transactions", { idempotent: true, body: { type: "transfer", memberId, amount, from: dir === "save" ? "spending" : "savings", to: dir === "save" ? "savings" : "spending" } }));
    if (ok) setOpen(false);
  }
  return (
    <>
      <Button onClick={() => setOpen(true)}>Move to savings</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Move money">
        <form onSubmit={submit} className="space-y-4" noValidate>
          {a.err && <Notice tone="spend">{a.err.message}</Notice>}
          <div className="flex gap-2 text-[14px]">
            <button type="button" onClick={() => setDir("save")} className={cx("flex-1 h-10 rounded-md border", dir === "save" ? "border-save bg-save-soft text-save font-medium" : "border-line-strong")}>Spending → Savings</button>
            <button type="button" onClick={() => setDir("unsave")} className={cx("flex-1 h-10 rounded-md border", dir === "unsave" ? "border-ink bg-warm font-medium" : "border-line-strong")}>Savings → Spending</button>
          </div>
          <p className="text-[13.5px] text-ink-3">{dir === "save" ? `You have ${formatMoney(spendingBalance, currency)} in spending.` : `You have ${formatMoney(savingsBalance, currency)} in savings.`}</p>
          <Field label="Amount" htmlFor="mv-a"><MoneyInput currency={currency} id="mv-a" name="amount" autoFocus /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={a.busy}>Move</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function RequestMoneyButton({ currency }: { currency: string }) {
  const [open, setOpen] = React.useState(false);
  const a = useAction();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = parseMoneyInput(String(fd.get("amount")), currency);
    if (!amount) { a.setErr({ code: "v", message: "Enter an amount." }); return; }
    const ok = await a.run(() => api("/api/approvals", { body: { amount, reason: fd.get("reason") } }));
    if (ok) setOpen(false);
  }
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Ask for money</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Ask a parent for money">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <p className="text-[14px] text-ink-2">Your parent will see this and can say yes or no. A clear reason helps.</p>
          {a.err && <Notice tone="spend">{a.err.message}</Notice>}
          <Field label="How much" htmlFor="rq-a"><MoneyInput currency={currency} id="rq-a" name="amount" autoFocus /></Field>
          <Field label="What for" htmlFor="rq-r"><Input id="rq-r" name="reason" placeholder="e.g. School project materials" required /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={a.busy}>Send request</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function WithdrawFromGoalButton({ goalId, currency, needsApproval, saved }: { goalId: string; currency: string; needsApproval: boolean; saved: number }) {
  const [open, setOpen] = React.useState(false);
  const a = useAction();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = parseMoneyInput(String(fd.get("amount")), currency);
    if (!amount) { a.setErr({ code: "v", message: "Enter an amount." }); return; }
    const ok = await a.run(() => api(`/api/goals/${goalId}/withdraw`, { idempotent: true, body: { amount, reason: fd.get("reason") } }));
    if (ok) setOpen(false);
  }
  if (saved <= 0) return null;
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>Take some out</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Take money out of this goal">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Notice tone="goal">{needsApproval ? "A parent needs to approve this. Think about whether waiting 7 days changes your mind." : "This moves money back to spending."}</Notice>
          {a.err && <Notice tone="spend">{a.err.message}</Notice>}
          <Field label="Amount" htmlFor="wd-a"><MoneyInput currency={currency} id="wd-a" name="amount" autoFocus /></Field>
          <Field label="Why" htmlFor="wd-r"><Input id="wd-r" name="reason" required placeholder="Be honest — it's for you as much as them" /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="secondary" loading={a.busy}>{needsApproval ? "Ask" : "Take out"}</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function ReflectButtons({ txnId, current }: { txnId: string; current?: string }) {
  const a = useAction();
  const [val, setVal] = React.useState(current);
  if (val) return <span className="text-[12.5px] text-ink-3">{val === "yes" ? "Worth it" : val === "no" ? "Not really" : "Not sure"}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-3">Worth it?
      {([["yes", Check], ["no", X], ["unsure", HelpCircle]] as const).map(([k, Icon]) => <button key={k} disabled={a.busy} onClick={() => a.run(() => api(`/api/transactions/${txnId}/reflect`, { body: { worthIt: k } }), () => setVal(k))} className="h-6 w-6 grid place-items-center rounded hover:bg-warm-2" aria-label={k === "yes" ? "Yes, worth it" : k === "no" ? "Not really" : "Not sure"}><Icon className="h-3.5 w-3.5" /></button>)}
    </span>
  );
}

export function LessonPlayer({ lesson, done }: { lesson: Lesson; done: boolean }) {
  const [picked, setPicked] = React.useState<number | null>(null);
  const [result, setResult] = React.useState<{ correct: boolean; why: string; earned: string[] } | null>(null);
  const [reflection, setReflection] = React.useState("");
  const a = useAction();
  const router = useRouter();
  async function submit() {
    if (picked === null) return;
    await a.run(() => api<{ correct: boolean; why: string; earned: string[] }>(`/api/lessons/${lesson.slug}/complete`, { body: { answer: picked, reflection: reflection || undefined } }), (d) => setResult(d));
  }
  return (
    <div className="space-y-8">
      <div className="space-y-4 text-[16.5px] leading-relaxed text-ink-2">{lesson.body.map((p, i) => <p key={i}>{p}</p>)}</div>
      <div className="border border-line rounded-lg p-5">
        <p className="text-[13px] font-medium text-ink-3 uppercase tracking-wide">Quick check</p>
        <p className="text-[16px] font-medium mt-1">{lesson.question.prompt}</p>
        <div className="mt-3 space-y-2" role="radiogroup">
          {lesson.question.options.map((o, i) => (
            <button key={i} role="radio" aria-checked={picked === i} disabled={!!result} onClick={() => setPicked(i)} className={cx("w-full text-left px-4 py-2.5 rounded-md border text-[15px]", picked === i ? "border-brand bg-brand-soft" : "border-line hover:bg-warm", result && i === lesson.question.answer && "border-save bg-save-soft", result && picked === i && i !== lesson.question.answer && "border-spend bg-spend-soft")}>{o}</button>
          ))}
        </div>
        {result && <p className={cx("mt-3 text-[14.5px]", result.correct ? "text-save" : "text-ink-2")}>{result.correct ? "Right. " : "Not quite. "}{result.why}</p>}
      </div>
      <div className="border border-line rounded-lg p-5 bg-warm">
        <p className="text-[13px] font-medium text-ink-3 uppercase tracking-wide">Try this for real</p>
        <p className="text-[15.5px] mt-1">{lesson.challenge}</p>
      </div>
      {!result && (
        <div>
          <label htmlFor="refl" className="block text-[14px] font-medium text-ink-2 mb-1.5">{lesson.reflect} <span className="text-ink-3 font-normal">(optional, goes in your journal)</span></label>
          <Textarea id="refl" value={reflection} onChange={(e) => setReflection(e.target.value)} maxLength={500} />
        </div>
      )}
      {a.err && <Notice tone="spend">{a.err.message}</Notice>}
      {!result ? <Button size="lg" onClick={submit} disabled={picked === null} loading={a.busy}>{done ? "Redo lesson" : "Finish lesson"}</Button> : (
        <div className="space-y-3 rise">
          {result.earned.length > 0 && <Notice tone="grow">New achievement: {result.earned.join(", ").replace(/_/g, " ")}</Notice>}
          <div className="flex gap-2"><Button size="lg" onClick={() => router.push("/me/learn")}>Back to lessons</Button></div>
        </div>
      )}
    </div>
  );
}

export function JournalForm({ prompt }: { prompt: string }) {
  const a = useAction();
  const [body, setBody] = React.useState("");
  const [shared, setShared] = React.useState(true);
  return (
    <form onSubmit={async (e) => { e.preventDefault(); const ok = await a.run(() => api("/api/journal", { body: { body, prompt, visibleToParents: shared } })); if (ok) setBody(""); }} className="space-y-3">
      <p className="text-[15.5px] font-medium">{prompt}</p>
      {a.err && <Notice tone="spend">{a.err.message}</Notice>}
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a few sentences…" maxLength={1000} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-[13.5px] text-ink-2 inline-flex items-center gap-2"><input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} className="accent-[#1f5eff]" />Parents can read this</label>
        <Button type="submit" loading={a.busy} disabled={body.trim().length < 2}>Save entry</Button>
      </div>
    </form>
  );
}
