import { redirect } from "next/navigation";
import { isSystemInitialized } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const initialized = await isSystemInitialized();
  if (!initialized) redirect("/setup");
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", background: "var(--background)" }}>
      <div className="ambient-backdrop" aria-hidden />
      <LoginForm nextPath={safeNext} style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "24rem" }} />
    </main>
  );
}
