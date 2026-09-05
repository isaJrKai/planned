import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/marketing/Shell";
import { getViewer } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const v = await getViewer();
  if (v) redirect(v.member.role === "parent" ? "/app" : "/me");
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 flex items-center px-5 sm:px-8"><Wordmark /></header>
      <main className="flex-1 flex items-start sm:items-center justify-center px-5 py-8">
        <div className="w-full max-w-[400px] rise">{children}</div>
      </main>
      <footer className="px-5 py-6 text-center text-[13px] text-ink-3">
        <Link href="/privacy" className="hover:text-ink">Privacy</Link><span className="mx-2">·</span><Link href="/terms" className="hover:text-ink">Terms</Link><span className="mx-2">·</span><Link href="/support" className="hover:text-ink">Support</Link>
      </footer>
    </div>
  );
}
