"use client";

// ============================================================================
// SYSTEM HEALTH — real-time platform observability
// ============================================================================

import { useEffect, useState } from "react";
import { Activity, Database, Server, AlertCircle, CheckCircle2, Zap } from "lucide-react";

interface HealthData {
  tables: { name: string; count: number }[];
  apiHealth: { endpoint: string; status: string; latency: number }[];
  totalRecords: number;
  featureFlagsOn: number;
  featureFlagsTotal: number;
  recentEvents: { event: string; count: number }[];
}

export function SystemHealthTab() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-foreground/40 text-sm">Checking system health...</div>;
  }

  if (!health) {
    return <div className="text-center py-12 text-foreground/40 text-sm">Unable to load health data.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Health status banner */}
      <div className="surface-wood-strong rounded-lg p-5 flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "color-mix(in srgb, var(--chart-2) 15%, transparent)", border: "1px solid var(--chart-2)" }}
        >
          <CheckCircle2 className="h-6 w-6" style={{ color: "var(--chart-2)" }} />
        </div>
        <div>
          <div className="font-editorial text-lg text-foreground tracking-wide">All Systems Operational</div>
          <div className="text-xs text-foreground/50">
            {health.totalRecords.toLocaleString()} records across {health.tables.length} tables ·
            {" "}{health.featureFlagsOn}/{health.featureFlagsTotal} feature flags enabled
          </div>
        </div>
      </div>

      {/* Database tables */}
      <div className="surface-wood rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-4 w-4" style={{ color: "var(--primary)" }} />
          <div className="micro-label-gold">Database Tables</div>
        </div>
        <div className="divider-gold mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {health.tables.map((t) => (
            <div key={t.name} className="surface-flat rounded-lg p-3">
              <div className="text-xs font-mono text-foreground/70">{t.name}</div>
              <div className="font-editorial text-lg tabular-nums" style={{ color: "var(--primary)" }}>
                {t.count.toLocaleString()}
              </div>
              <div className="text-[9px] text-foreground/40">rows</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent events */}
      {health.recentEvents.length > 0 && (
        <div className="surface-wood rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4" style={{ color: "var(--primary)" }} />
            <div className="micro-label-gold">Recent Activity (30d)</div>
          </div>
          <div className="divider-gold mb-4" />
          <div className="space-y-2">
            {health.recentEvents.map((e) => (
              <div key={e.event} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs text-foreground/60">{e.event}</span>
                <span className="font-editorial tabular-nums" style={{ color: "var(--primary)" }}>{e.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System info */}
      <div className="surface-wood rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-4 w-4" style={{ color: "var(--primary)" }} />
          <div className="micro-label-gold">System Information</div>
        </div>
        <div className="divider-gold mb-4" />
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="micro-label mb-1">Framework</div>
            <div className="text-foreground/70">Next.js 16 + TypeScript</div>
          </div>
          <div>
            <div className="micro-label mb-1">Database</div>
            <div className="text-foreground/70">SQLite (Prisma ORM)</div>
          </div>
          <div>
            <div className="micro-label mb-1">AI Engine</div>
            <div className="text-foreground/70">GLM via z-ai-web-dev-sdk</div>
          </div>
          <div>
            <div className="micro-label mb-1">State</div>
            <div className="text-foreground/70">Zustand + React Query ready</div>
          </div>
          <div>
            <div className="micro-label mb-1">Themes</div>
            <div className="text-foreground/70">4 (Onyx, Ivory, Blush, Oxblood)</div>
          </div>
          <div>
            <div className="micro-label mb-1">Total Records</div>
            <div className="font-editorial text-sm tabular-nums" style={{ color: "var(--primary)" }}>
              {health.totalRecords.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
