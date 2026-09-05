"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Users, ListChecks, Wallet, Target, ArrowLeftRight, BarChart3, Settings, LogOut, Menu, X, BookOpen, Award, PenLine, type LucideIcon } from "lucide-react";
import { Wordmark } from "@/components/marketing/Shell";
import { cx } from "@/components/ui";

export type NavItem = { href: string; label: string; icon: string; badge?: number };
const ICONS: Record<string, LucideIcon> = { LayoutGrid, Users, ListChecks, Wallet, Target, ArrowLeftRight, BarChart3, Settings, BookOpen, Award, PenLine };

export function AppShell({ nav, children, user, family, roleLabel }: { nav: NavItem[]; children: React.ReactNode; user: string; family: string; roleLabel: string }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => setOpen(false), [path]);
  async function signOut() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }
  const NavList = (
    <nav className="space-y-0.5" aria-label="App">
      {nav.map((n) => {
        const Icon = ICONS[n.icon] ?? LayoutGrid;
        const active = n.href === path || (n.href !== "/app" && n.href !== "/me" && path.startsWith(n.href));
        return (
          <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cx("flex items-center gap-2.5 px-3 h-9 rounded-md text-[14.5px]", active ? "bg-brand-soft text-brand font-medium" : "text-ink-2 hover:bg-warm hover:text-ink")}>
            <Icon className="h-4 w-4" aria-hidden />
            <span className="flex-1">{n.label}</span>
            {n.badge ? <span className="h-5 min-w-5 px-1.5 inline-flex items-center justify-center rounded-full bg-goal-soft text-goal text-[12px] font-medium tnum">{n.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[236px_1fr]">
      <aside className="hidden lg:flex flex-col border-r border-line bg-paper sticky top-0 h-screen">
        <div className="h-16 px-5 flex items-center"><Wordmark /></div>
        <div className="px-3 flex-1">{NavList}</div>
        <div className="p-3 border-t border-line">
          <div className="px-3 py-2">
            <p className="text-[14px] font-medium truncate">{user}</p>
            <p className="text-[12.5px] text-ink-3 truncate">{roleLabel} · {family}</p>
          </div>
          <button onClick={signOut} className="w-full flex items-center gap-2.5 px-3 h-9 rounded-md text-[14px] text-ink-2 hover:bg-warm hover:text-ink"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="lg:hidden h-14 border-b border-line flex items-center justify-between px-4 sticky top-0 bg-paper z-30">
          <Wordmark />
          <button onClick={() => setOpen((o) => !o)} className="h-9 w-9 grid place-items-center rounded-md hover:bg-warm" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </header>
        {open && (
          <div className="lg:hidden fixed inset-x-0 top-14 bottom-0 z-20 bg-paper p-3 overflow-y-auto">
            {NavList}
            <div className="mt-4 border-t border-line pt-3">
              <p className="px-3 text-[14px] font-medium">{user}</p>
              <p className="px-3 text-[12.5px] text-ink-3">{roleLabel} · {family}</p>
              <button onClick={signOut} className="mt-2 w-full flex items-center gap-2.5 px-3 h-9 rounded-md text-[14px] text-ink-2 hover:bg-warm"><LogOut className="h-4 w-4" />Sign out</button>
            </div>
          </div>
        )}
        <main className="mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="text-[28px] sm:text-[32px] font-semibold leading-tight">{title}</h1>
        {sub && <p className="text-ink-2 mt-1 text-[15.5px]">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
