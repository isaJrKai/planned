import { SecuritySettingsForm } from "./SecuritySettingsForm";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const user = await getAuthUser();
  if (!user) return null;
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { email: true, securityQuestion: true, twoFactorEnabled: true, twoFactorEnrolledAt: true, twoFactorBackupCodesHash: true, lastLoginAt: true, createdAt: true },
  });

  let backupCodesRemaining = 0;
  if (dbUser?.twoFactorBackupCodesHash) {
    try { backupCodesRemaining = JSON.parse(dbUser.twoFactorBackupCodesHash).length; } catch { backupCodesRemaining = 0; }
  }

  return (
    <main id="main-content" className="min-h-screen px-4 md:px-8 py-6 md:py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="micro-label-gold mb-1">Founder Security</div>
            <h1 className="font-editorial text-2xl text-foreground tracking-editorial">Account Security</h1>
          </div>
          <Link href="/admin" className="btn-ghost px-3 py-1.5 rounded text-[11px] tracking-wider">Back to admin</Link>
        </div>
        <div className="divider-gold mb-6" />
        <div className="surface-wood rounded-lg p-5 mb-6">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><div className="text-foreground/40 mb-1">User ID (authoritative)</div><div className="text-foreground/80 font-mono text-[10px] break-all">{user.id}</div></div>
            <div><div className="text-foreground/40 mb-1">Current email</div><div className="text-foreground font-mono">{dbUser?.email}</div></div>
            <div><div className="text-foreground/40 mb-1">Last login</div><div className="text-foreground/80">{dbUser?.lastLoginAt ? new Date(dbUser.lastLoginAt).toLocaleString() : "Never"}</div></div>
            <div><div className="text-foreground/40 mb-1">2FA status</div><div className="text-foreground/80">{dbUser?.twoFactorEnabled ? <span style={{ color: "var(--chart-2)" }}>● Enabled</span> : <span style={{ color: "var(--chart-3)" }}>○ Not enabled</span>}{dbUser?.twoFactorEnabled && <span className="text-foreground/40 ml-2">({backupCodesRemaining} backup codes left)</span>}</div></div>
          </div>
        </div>
        <SecuritySettingsForm currentEmail={dbUser?.email ?? ""} twoFactorEnabled={dbUser?.twoFactorEnabled ?? false} backupCodesRemaining={backupCodesRemaining} />
        <div className="mt-6 surface-flat rounded-lg p-4 text-[11px] text-foreground/50 leading-relaxed">
          <strong className="text-foreground/70">Security notes:</strong>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li>All changes require your current password to be re-entered.</li>
            <li>If 2FA is enabled, all security changes also require a valid TOTP code.</li>
            <li>Email changes re-issue your session token immediately.</li>
            <li>The authoritative identifier is your user ID (immutable). Email is metadata.</li>
            <li>Every change is recorded in the audit log with IP and user agent.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
