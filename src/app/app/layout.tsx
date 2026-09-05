import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { AppShell } from "@/components/app/Shell";
import { listPendingApprovals } from "@/lib/family";
import { processDueAllowances } from "@/lib/allowances";

export const dynamic = "force-dynamic";

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const v = await getViewer();
  if (!v) redirect("/login");
  if (v.member.role !== "parent") redirect("/me");
  // Lazy scheduler: settle any due allowances when a parent opens the app.
  await processDueAllowances(v.family.id).catch(() => []);
  const pending = await listPendingApprovals(v.family.id);
  const nav = [
    { href: "/app", label: "Overview", icon: "LayoutGrid" },
    { href: "/app/children", label: "Children", icon: "Users" },
    { href: "/app/approvals", label: "Approvals", icon: "ListChecks", badge: pending.length },
    { href: "/app/allowances", label: "Allowances", icon: "Wallet" },
    { href: "/app/goals", label: "Goals", icon: "Target" },
    { href: "/app/transactions", label: "Transactions", icon: "ArrowLeftRight" },
    { href: "/app/reports", label: "Reports", icon: "BarChart3" },
    { href: "/app/settings", label: "Settings", icon: "Settings" },
  ];
  return <AppShell nav={nav} user={v.user.displayName} family={v.family.name} roleLabel="Parent">{children}</AppShell>;
}
