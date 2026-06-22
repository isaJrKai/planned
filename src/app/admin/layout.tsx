import { redirect } from "next/navigation";
import { getAuthUser, isSuperAdmin, auditLog } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = headerStore.get("user-agent") ?? "unknown";
  const path = headerStore.get("x-path") ?? "/admin";

  if (!user) { redirect("/login?next=/admin"); }
  if (!isSuperAdmin(user)) {
    await auditLog({ userId: user.id, action: "ADMIN_ACCESS_FORBIDDEN", entityType: "admin", entityId: path, ipAddress: ip, userAgent: ua, success: false, after: { role: user.role } });
    redirect("/");
  }
  await auditLog({ userId: user.id, action: "ADMIN_ACCESS_OK", entityType: "admin", entityId: path, ipAddress: ip, userAgent: ua, success: true });
  return <>{children}</>;
}
