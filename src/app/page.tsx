import Link from "next/link";
import { ArrowRight, ShieldCheck, Wallet, Target, BookOpen, ListChecks } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/marketing/Shell";
import { DemoPreview } from "@/components/marketing/DemoPreview";

export default function Home() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main>
        <section className="mx-auto max-w-6xl px-5 pt-16 sm:pt-24 pb-10">
          <div className="max-w-2xl">
            <h1 className="text-[40px] sm:text-[52px] font-semibold leading-[1.05] tracking-tight">Money your family learns together.</h1>
            <p className="mt-5 text-[17px] sm:text-[19px] text-ink-2 leading-relaxed max-w-xl">
              Planned gives children real goals, a real allowance, and real choices — with parents holding the rules. Every shilling is tracked, every request is answered, and the lessons come from what actually happened.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="h-12 px-5 inline-flex items-center gap-2 rounded-md bg-brand text-white font-medium hover:bg-brand-strong text-[15.5px]">Create your family <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/demo" className="h-12 px-5 inline-flex items-center rounded-md border border-line-strong font-medium hover:bg-warm text-[15.5px]">Try the Kato family demo</Link>
            </div>
            <p className="mt-4 text-[13.5px] text-ink-3">Free while in early access. No card. Delete everything whenever you like.</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <DemoPreview />
        </section>

        <section className="bg-warm border-y border-line">
          <div className="mx-auto max-w-6xl px-5 py-20 grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-[13px] font-medium text-brand uppercase tracking-wide">For parents</p>
              <h2 className="text-[28px] font-semibold mt-2 leading-tight">One place to see how the family is doing.</h2>
              <ul className="mt-6 space-y-4 text-[15.5px] text-ink-2">
                <li className="flex gap-3"><Wallet className="h-5 w-5 text-brand shrink-0 mt-0.5" /><span><strong className="text-ink">Allowances that run themselves.</strong> Weekly or monthly, split automatically between spending, savings and a goal.</span></li>
                <li className="flex gap-3"><ListChecks className="h-5 w-5 text-goal shrink-0 mt-0.5" /><span><strong className="text-ink">A single approval queue.</strong> Money requests, big purchases and goal withdrawals land in one list with approve and decline.</span></li>
                <li className="flex gap-3"><ShieldCheck className="h-5 w-5 text-save shrink-0 mt-0.5" /><span><strong className="text-ink">Rules the software enforces.</strong> Minimum saving rates, spending limits and approval thresholds are checked on the server, not in a child&rsquo;s browser.</span></li>
              </ul>
            </div>
            <div>
              <p className="text-[13px] font-medium text-save uppercase tracking-wide">For children</p>
              <h2 className="text-[28px] font-semibold mt-2 leading-tight">Goals that feel closer every week.</h2>
              <ul className="mt-6 space-y-4 text-[15.5px] text-ink-2">
                <li className="flex gap-3"><Target className="h-5 w-5 text-goal shrink-0 mt-0.5" /><span><strong className="text-ink">A goal with a date on it.</strong> Planned works out when they&rsquo;ll get there from what they actually save — and what changes if they save a little more.</span></li>
                <li className="flex gap-3"><BookOpen className="h-5 w-5 text-grow shrink-0 mt-0.5" /><span><strong className="text-ink">Sixteen short lessons in four levels.</strong> From what money is, to interest, risk and debt. Each one ends with something to try for real.</span></li>
                <li className="flex gap-3"><Wallet className="h-5 w-5 text-spend shrink-0 mt-0.5" /><span><strong className="text-ink">Spending they reflect on.</strong> Need or want? Worth it a week later? Small questions that build judgement.</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="max-w-2xl">
            <h2 className="text-[28px] font-semibold leading-tight">Built like financial software, because it is.</h2>
            <p className="mt-3 text-ink-2 text-[16px]">Planned holds records of your family&rsquo;s money. We treat that seriously.</p>
          </div>
          <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 text-[15px]">
            {[
              ["A real ledger", "Every movement of money is a transaction. Balances are derived from the ledger and reconciled against it."],
              ["No double payments", "Paying an allowance twice, or approving a request twice, does nothing the second time. Every money action carries an idempotency key."],
              ["Whole numbers only", "Amounts are stored as integers. There is no floating-point rounding anywhere in the money path."],
              ["Server-side authorisation", "Every request checks that you belong to the family and have the role to act. IDs from the browser are never trusted."],
              ["An audit trail", "Sign-ins, password changes, payments, approvals and rule changes are recorded with who, when and from where."],
              ["Your data, your call", "Export everything as JSON or delete the whole family — children, ledger, lessons — in one step from Settings."],
            ].map(([t, b]) => (
              <div key={t}><dt className="font-semibold text-ink">{t}</dt><dd className="text-ink-2 mt-1">{b}</dd></div>
            ))}
          </dl>
          <p className="mt-8 text-[14px] text-ink-3">More detail on the <Link href="/security" className="underline underline-offset-2 hover:text-ink">security page</Link>.</p>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-8">
          <div className="border border-line rounded-lg p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-warm">
            <div>
              <h2 className="text-[24px] font-semibold">Start with one child and one goal.</h2>
              <p className="text-ink-2 mt-1">It takes about two minutes. You can add the rest later.</p>
            </div>
            <Link href="/signup" className="h-12 px-5 inline-flex items-center gap-2 rounded-md bg-brand text-white font-medium hover:bg-brand-strong shrink-0">Create your family <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
