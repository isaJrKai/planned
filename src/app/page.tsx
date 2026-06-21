// app/page.tsx — server component, auth gate
import { redirect } from "next/navigation";
import { isSystemInitialized, getAuthUser } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialized = await isSystemInitialized();
  if (!initialized) redirect("/setup");

  const user = await getAuthUser();
  if (!user) redirect("/login");

  return <DashboardClient isAdmin={user.role === "SUPER_ADMIN"} userEmail={user.email} />;
}
