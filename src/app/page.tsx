// app/page.tsx — server component, auth gate
import { redirect } from "next/navigation";
import { isSystemInitialized, getAuthUser } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const initialized = await isSystemInitialized();
  if (!initialized) redirect("/setup");

  const user = await getAuthUser();
  if (!user) redirect("/login");

  // CHILD users go to /child, everyone else stays on /
  if (user.familyRole === "CHILD") redirect("/child");

  return <DashboardClient isFounder={user.platformRole === "FOUNDER"} userEmail={user.email} />;
}
