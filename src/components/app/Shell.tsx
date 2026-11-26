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
  React.useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const NavList = (
    <nav className="space-y-1" aria-label="App navigation">
      {nav.map((n) => {
        const Icon = ICONS[n.icon] ?? LayoutGrid;
        const active = n.href === path || (n.href !== "/app" && n.href !== "/me" && path.startsWith(n.href));
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "group flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-[14.5px] transition-colors",
              active
                ? "bg-brand-soft text-brand font-semibold"
                : "text-ink-2 hover:bg-warm hover:text-ink",
            )}
          >
            <Icon className="h-[17px] w-[17px] shrink-0" aria-hidden />
            <span className="min-w-0 flex-1">{n.label}</span>
            {n.badge ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-goal-soft px-1.5 text-[12px] font-semibold text-goal tnum" aria-label={`${n.badge} pending`}>
                {n.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-paper lg:flex">
        <div className="flex h-16 items-center px-6"><Wordmark /></div>
        <div className="flex-1 px-3 py-3">{NavList}</div>
        <div className="border-t border-line p-3">
          <div className="rounded-md px-3 py-2">
            <p className="truncate text-[14px] font-semibold">{user}</p>
            <p className="truncate text-[12.5px] text-ink-3">{roleLabel} · {family}</p>
          </div>
          <button onClick={signOut} className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-[14px] text-ink-2 hover:bg-warm hover:text-ink">
            <LogOut className="h-4 w-4" aria-hidden />Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur-sm lg:hidden">
          <Wordmark />
          <button
            onClick={() => setOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-md text-ink-2 hover:bg-warm hover:text-ink"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-app-navigation"
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </header>

        {open && (
          <>
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setOpen(false)}
              className="fixed inset-x-0 bottom-0 top-14 z-20 bg-ink/20 lg:hidden"
            />
            <div
              id="mobile-app-navigation"
              className="fixed inset-x-0 bottom-0 top-14 z-20 overflow-y-auto border-b border-line bg-paper p-3 shadow-[var(--shadow-lifted)] lg:hidden"
            >
              <div className="mb-3 px-3 pt-2">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">Your workspace</p>
              </div>
              {NavList}
              <div className="mt-4 border-t border-line pt-3">
                <div className="px-3 py-2">
                  <p className="truncate text-[14px] font-semibold">{user}</p>
                  <p className="truncate text-[12.5px] text-ink-3">{roleLabel} · {family}</p>
                </div>
                <button onClick={signOut} className="mt-1 flex h-10 w-full items-center gap-3 rounded-md px-3 text-[14px] text-ink-2 hover:bg-warm">
                  <LogOut className="h-4 w-4" aria-hidden />Sign out
                </button>
              </div>
            </div>
          </>
        )}

        <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-3 border-b border-line pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-6">
      <div className="min-w-0">
        <h1 className="text-[27px] font-semibold leading-tight sm:text-[32px]">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-ink-2 sm:text-[15px]">{sub}</p>}
      </div>
      {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
    </div>
  );
}
