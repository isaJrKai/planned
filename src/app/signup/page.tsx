import { redirect } from "next/navigation";
import { isSystemInitialized, getAuthUser } from "@/lib/auth";
import { SignupForm } from "./SignupForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SignupPage() {
  const initialized = await isSystemInitialized();
  if (!initialized) redirect("/setup");
  const user = await getAuthUser();
  if (user) { if (user.familyRole === "CHILD") redirect("/child"); redirect("/"); }
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", background: "var(--background)" }}>
      <div className="ambient-backdrop" aria-hidden />
      <SignupForm style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "24rem" }} />
    </main>
  );
}
