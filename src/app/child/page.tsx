import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { ChildDashboardClient } from "@/components/child/ChildDashboardClient";
export const dynamic = "force-dynamic";
export default async function ChildPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.familyRole !== "CHILD") redirect("/");
  return <ChildDashboardClient />;
}
