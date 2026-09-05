import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { AppShell } from "@/components/app/Shell";

export const dynamic = "force-dynamic";

export default async function ChildLayout({ children }: { children: ReactNode }) {
  const v = await getViewer();
  if (!v) redirect("/login");
  if (v.member.role !== "child") redirect("/app");
  const nav = [
    { href: "/me", label: "Home", icon: "LayoutGrid" },
    { href: "/me/goals", label: "My goals", icon: "Target" },
    { href: "/me/money", label: "My money", icon: "Wallet" },
    { href: "/me/learn", label: "Learn", icon: "BookOpen" },
    { href: "/me/achievements", label: "Achievements", icon: "Award" },
    { href: "/me/journal", label: "Journal", icon: "PenLine" },
  ];
  return <AppShell nav={nav} user={v.user.displayName} family={v.family.name} roleLabel="Member">{children}</AppShell>;
}
