import Link from "next/link";
import type { ReactNode } from "react";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 font-semibold text-ink ${className}`} aria-label="Planned home">
      <span className="h-6 w-6 rounded-[7px] bg-brand grid place-items-center">
        <span className="h-2 w-2 rounded-full bg-white" />
      </span>
      Planned
    </Link>
  );
}

export function PublicHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Wordmark />
        <nav className="flex items-center gap-1 text-[14.5px]" aria-label="Primary">
          <Link href="/demo" className="px-3 py-2 rounded-md text-ink-2 hover:text-ink hover:bg-warm">See a demo</Link>
          <Link href="/security" className="px-3 py-2 rounded-md text-ink-2 hover:text-ink hover:bg-warm hidden sm:inline-block">Security</Link>
          <Link href="/login" className="px-3 py-2 rounded-md text-ink-2 hover:text-ink hover:bg-warm">Sign in</Link>
          <Link href="/signup" className="ml-1 h-9 px-3.5 inline-flex items-center rounded-md bg-brand text-white font-medium hover:bg-brand-strong">Create your family</Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line mt-24">
      <div className="mx-auto max-w-6xl px-5 py-10 grid gap-8 sm:grid-cols-4 text-[14px]">
        <div className="sm:col-span-2">
          <Wordmark />
          <p className="text-ink-3 mt-3 max-w-xs">Built for families learning money together. Parents stay in control; children learn by doing.</p>
        </div>
        <div>
          <p className="font-medium mb-2">Product</p>
          <ul className="space-y-1.5 text-ink-2">
            <li><Link href="/demo" className="hover:text-ink">Interactive demo</Link></li>
            <li><Link href="/security" className="hover:text-ink">Security</Link></li>
            <li><Link href="/support" className="hover:text-ink">Support</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-medium mb-2">Trust</p>
          <ul className="space-y-1.5 text-ink-2">
            <li><Link href="/privacy" className="hover:text-ink">Privacy policy</Link></li>
            <li><Link href="/terms" className="hover:text-ink">Terms of service</Link></li>
            <li><Link href="/privacy#children" className="hover:text-ink">Children&rsquo;s privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-8 text-[13px] text-ink-4">© {new Date().getFullYear()} Planned. Amounts shown in examples are illustrative.</div>
    </footer>
  );
}

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="mx-auto max-w-2xl px-5 py-14 flex-1 w-full">
        <h1 className="text-[34px] font-semibold leading-tight">{title}</h1>
        <p className="text-ink-3 mt-2 text-[14px]">Last updated {updated}</p>
        <div className="mt-8 space-y-6 text-[15.5px] leading-relaxed text-ink-2 [&_h2]:text-ink [&_h2]:font-semibold [&_h2]:text-[19px] [&_h2]:mt-10 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-ink">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}
