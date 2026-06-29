import { redirect } from "next/navigation";
import { isSystemInitialized, getAuthUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const initialized = await isSystemInitialized();
  if (!initialized) redirect("/setup");

  // If the visitor already has a valid (non-revoked, non-expired) session,
  // send them straight to their dashboard instead of showing the login form.
  // This closes the "I'm logged in but seeing /login" UX confusion, and also
  // prevents the founder session from "coming back" after logout — if their
  // session is still valid, they shouldn't be on /login; if it's revoked,
  // getAuthUser() returns null and we show the form.
  const user = await getAuthUser();
  if (user) {
    const { next } = await searchParams;
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    // CHILD users go to /child, everyone else to /
    redirect(user.familyRole === "CHILD" ? "/child" : safeNext);
  }

  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", background: "var(--background)" }}>
      <div className="ambient-backdrop" aria-hidden />
      <LoginForm nextPath={safeNext} style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "24rem" }} />
    </main>
  );
}