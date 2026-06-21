import { redirect } from "next/navigation";
import { isSystemInitialized, FOUNDER_EMAIL_DEFAULT } from "@/lib/auth";
import { SetupForm } from "./SetupForm";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const initialized = await isSystemInitialized();
  if (initialized) redirect("/");
  const defaultEmail = FOUNDER_EMAIL_DEFAULT || "worldclasswinner@protonmail.com";
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", background: "var(--background)" }}>
      <div className="ambient-backdrop" aria-hidden />
      <SetupForm defaultEmail={defaultEmail} style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "32rem" }} />
    </main>
  );
}
