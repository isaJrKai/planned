import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SignOutButton } from "./SignOutButton";
import Link from "next/link";
import { Shield, Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getAuthUser();
  const dbUser = await db.user.findUnique({
    where: { id: user!.id },
    select: { twoFactorEnabled: true, lastLoginAt: true, createdAt: true },
  });

  // Fetch real stats from DB
  const [childCount, parentCount, txCount, goalCount, auditCount] = await Promise.all([
    db.child.count(),
    db.parentProfile.count(),
    db.transaction.count(),
    db.goal.count(),
    db.auditLog.count(),
  ]);

  return (
    <main id="main-content" className="min-h-screen px-4 md:px-8 py-6 md:py-10">
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", border: "1px solid var(--hairline-strong)" }}>
            <Shield className="h-4 w-4" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <div className="micro-label-gold">Founder Console</div>
            <div className="font-editorial text-sm text-foreground tracking-wide">{user?.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/security" className="btn-ghost px-3 py-1.5 rounded text-[11px] tracking-wider flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5" /> Security
          </Link>
          <Link href="/" className="btn-ghost px-3 py-1.5 rounded text-[11px] tracking-wider">Back to app</Link>
          <SignOutButton />
        </div>
      </div>

      {/* Stats grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Children" value={childCount} />
        <StatCard label="Parents" value={parentCount} />
        <StatCard label="Transactions" value={txCount} />
        <StatCard label="Goals" value={goalCount} />
        <StatCard label="Audit entries" value={auditCount} />
      </div>

      {/* Account info */}
      <div className="max-w-6xl mx-auto surface-wood rounded-lg p-6 mb-6">
        <h2 className="font-editorial text-sm text-foreground tracking-wide mb-4">Account Information</h2>
        <div className="divider-gold mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-foreground/40 mb-1">User ID (authoritative)</div>
            <div className="text-foreground/80 font-mono text-[10px] break-all">{user?.id}</div>
          </div>
          <div>
            <div className="text-foreground/40 mb-1">Email</div>
            <div className="text-foreground font-mono">{user?.email}</div>
          </div>
          <div>
            <div className="text-foreground/40 mb-1">2FA Status</div>
            <div className="text-foreground/80">
              {dbUser?.twoFactorEnabled ? <span style={{ color: "var(--chart-2)" }}>● Enabled</span> : <span style={{ color: "var(--chart-3)" }}>○ Not enabled</span>}
            </div>
          </div>
          <div>
            <div className="text-foreground/40 mb-1">Last login</div>
            <div className="text-foreground/80">{dbUser?.lastLoginAt ? new Date(dbUser.lastLoginAt).toLocaleString() : "Never"}</div>
          </div>
          <div>
            <div className="text-foreground/40 mb-1">Account created</div>
            <div className="text-foreground/80">{dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString() : "Unknown"}</div>
          </div>
          <div>
            <div className="text-foreground/40 mb-1">Role</div>
            <div className="text-foreground/80">{user?.platformRole}</div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/security" className="surface-wood rounded-lg p-5 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4" style={{ color: "var(--primary)" }} />
            <h3 className="font-editorial text-sm text-foreground tracking-wide">Security Settings</h3>
          </div>
          <p className="text-[11px] text-foreground/50 leading-relaxed">Change password, change email, enroll in 2FA, manage backup codes.</p>
        </Link>
        <Link href="/" className="surface-wood rounded-lg p-5 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4" style={{ color: "var(--primary)" }} />
            <h3 className="font-editorial text-sm text-foreground tracking-wide">Back to Dashboard</h3>
          </div>
          <p className="text-[11px] text-foreground/50 leading-relaxed">Return to the family savings dashboard.</p>
        </Link>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-wood rounded-lg p-4">
      <div className="text-[10px] text-foreground/40 tracking-wider uppercase mb-1">{label}</div>
      <div className="font-editorial text-2xl text-foreground tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}
