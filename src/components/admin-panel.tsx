"use client";

// ============================================================================
// ADMIN PANEL — platform management dashboard
// ============================================================================

import { useEffect, useState } from "react";
import {
  Settings,
  Flag,
  BarChart3,
  Users,
  BookOpen,
  Award,
  Database,
  Activity,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Server,
  TrendingUp,
  Shield,
  FileText,
  Compass,
} from "lucide-react";
import { SystemHealthTab } from "./system-health";
import { MetricsDashboard } from "./metrics-dashboard";
import { AuditLogTab } from "./audit-log";
import { DecisionRecordsTab } from "./decision-records";
import { CapabilityMaturityTab } from "./capability-maturity";
import { LessonsLearnedTab } from "./lessons-learned";
import { FounderDashboard } from "./founder-dashboard";
import { KnowledgePlatformTab } from "./knowledge-platform";

type AdminTab = "overview" | "metrics" | "feature-flags" | "analytics" | "health" | "audit" | "decisions" | "maturity" | "lessons" | "founder" | "knowledge" | "families" | "content";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: string;
  updatedAt: string;
}

export function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>("overview");

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "metrics", label: "Metrics", icon: TrendingUp },
    { id: "feature-flags", label: "Feature Flags", icon: Flag },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "health", label: "System Health", icon: Server },
    { id: "audit", label: "Audit Log", icon: Shield },
    { id: "decisions", label: "Decisions", icon: FileText },
    { id: "maturity", label: "Maturity", icon: TrendingUp },
    { id: "lessons", label: "Lessons", icon: BookOpen },
    { id: "founder", label: "Founder", icon: Compass },
    { id: "knowledge", label: "Knowledge", icon: Database },
    { id: "families", label: "Families", icon: Users },
    { id: "content", label: "Content", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="ambient-backdrop" aria-hidden />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="micro-label-gold mb-1">PLANNED · ADMIN</div>
          <h1 className="font-editorial text-3xl text-foreground tracking-editorial">
            Platform Administration
          </h1>
          <p className="text-xs text-foreground/55 mt-1">
            Feature flags, analytics, family management, and content controls.
          </p>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 border-b border-[var(--hairline)] overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-xs tracking-wider transition-colors relative whitespace-nowrap flex items-center gap-2 ${
                tab === t.id ? "text-[var(--chart-5)]" : "text-foreground/50 hover:text-foreground/80"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label.toUpperCase()}
              {tab === t.id && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "overview" && <OverviewTab />}
        {tab === "metrics" && <MetricsDashboard />}
        {tab === "feature-flags" && <FeatureFlagsTab />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "health" && <SystemHealthTab />}
        {tab === "audit" && <AuditLogTab />}
        {tab === "decisions" && <DecisionRecordsTab />}
        {tab === "maturity" && <CapabilityMaturityTab />}
        {tab === "lessons" && <LessonsLearnedTab />}
        {tab === "founder" && <FounderDashboard />}
        {tab === "knowledge" && <KnowledgePlatformTab />}
        {tab === "families" && <FamiliesTab />}
        {tab === "content" && <ContentTab />}
      </div>
    </div>
  );
}

// ---- Overview Tab ----------------------------------------------------------

function OverviewTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics").then((r) => r.json()),
      fetch("/api/feature-flags").then((r) => r.json()),
    ]).then(([analytics, flags]) => {
      setStats({ analytics, flags });
      setLoading(false);
    }).catch(() => {
      setError("Failed to load admin overview. Check your connection and reload.");
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-foreground/40 text-sm py-12 text-center">Loading...</div>;
  if (error) return (
    <div className="surface-flat rounded-lg p-6 text-center">
      <div className="text-foreground/60 text-sm mb-3">{error}</div>
      <button onClick={() => window.location.reload()} className="btn-ghost px-3 py-1.5 rounded text-xs tracking-wider">Reload</button>
    </div>
  );

  const cards = [
    {
      label: "Feature Flags",
      value: stats.flags?.flags?.filter((f: FeatureFlag) => f.enabled).length ?? 0,
      sub: `of ${stats.flags?.flags?.length ?? 0} total enabled`,
      icon: Flag,
    },
    {
      label: "Active Users (30d)",
      value: stats.analytics?.dau ?? 0,
      sub: "unique users",
      icon: Users,
    },
    {
      label: "Events Tracked (30d)",
      value: Object.values(stats.analytics?.eventCounts ?? {}).reduce((a: number, b: any) => a + b, 0),
      sub: "total events",
      icon: Activity,
    },
    {
      label: "AI Coach Queries",
      value: stats.analytics?.eventCounts?.coach_query ?? 0,
      sub: "in last 30 days",
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
        {cards.map((c) => (
          <div key={c.label} className="surface-wood rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="micro-label">{c.label}</div>
              <c.icon className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
            </div>
            <div className="font-editorial text-2xl text-foreground tabular-nums">{c.value}</div>
            <div className="text-[10px] text-foreground/45 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Event breakdown */}
      {stats.analytics?.eventCounts && Object.keys(stats.analytics.eventCounts).length > 0 && (
        <div className="surface-wood rounded-lg p-6">
          <div className="micro-label-gold mb-1">Event Breakdown (30 days)</div>
          <h3 className="font-editorial text-lg text-foreground tracking-wide mb-4">
            Analytics Events
          </h3>
          <div className="divider-gold mb-4" />
          <div className="space-y-2">
            {Object.entries(stats.analytics.eventCounts)
              .sort((a: any, b: any) => b[1] - a[1])
              .map(([event, count]: [string, any]) => (
                <div key={event} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/70 tracking-wide font-mono">{event}</span>
                  <span className="font-editorial tabular-nums" style={{ color: "var(--primary)" }}>{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Feature Flags Tab -----------------------------------------------------

function FeatureFlagsTab() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/feature-flags")
      .then((r) => r.json())
      .then((data) => {
        setFlags(data.flags ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const toggle = async (key: string, enabled: boolean) => {
    await fetch("/api/feature-flags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, enabled }),
    });
    load();
  };

  if (loading) return <div className="text-foreground/40 text-sm py-12 text-center">Loading flags...</div>;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <div className="micro-label-gold mb-1">Platform Controls</div>
          <h3 className="font-editorial text-lg text-foreground tracking-wide">Feature Flags</h3>
        </div>
        <button onClick={load} className="btn-ghost p-2 rounded">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="surface-wood rounded-lg overflow-hidden">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Flag</th>
              <th>Description</th>
              <th>Scope</th>
              <th className="text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((f) => (
              <tr key={f.id}>
                <td>
                  <div className="font-editorial text-sm text-foreground tracking-wide">{f.name}</div>
                  <div className="micro-label mt-0.5 font-mono">{f.key}</div>
                </td>
                <td className="text-foreground/55 text-xs">{f.description}</td>
                <td>
                  <span className="pill pill-muted">{f.scope}</span>
                </td>
                <td className="text-right">
                  <button
                    onClick={() => toggle(f.key, !f.enabled)}
                    className="inline-flex items-center gap-1 text-xs tracking-wider"
                    style={{ color: f.enabled ? "var(--chart-2)" : "var(--text-faint)" }}
                  >
                    {f.enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    {f.enabled ? "ON" : "OFF"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Analytics Tab ---------------------------------------------------------

function AnalyticsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="text-foreground/40 text-sm py-12 text-center">Loading analytics...</div>;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="surface-wood rounded-lg p-6">
        <div className="micro-label-gold mb-1">Last 30 Days</div>
        <h3 className="font-editorial text-lg text-foreground tracking-wide mb-4">Platform Analytics</h3>
        <div className="divider-gold mb-5" />
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="font-editorial text-3xl text-gold-foil-static tabular-nums">{data.dau}</div>
            <div className="micro-label mt-1">Unique active users</div>
          </div>
          <div>
            <div className="font-editorial text-3xl text-foreground tabular-nums">
              {Object.values(data.eventCounts ?? {}).reduce((a: number, b: any) => a + b, 0)}
            </div>
            <div className="micro-label mt-1">Total events tracked</div>
          </div>
        </div>
        <div className="space-y-2">
          {(Object.entries(data.eventCounts ?? {}) as [string, number][])
            .sort((a, b) => b[1] - a[1])
            .map(([event, count]) => {
              const max = Math.max(1, ...Object.values(data.eventCounts ?? { _: 1 }) as number[]);
              return (
                <div key={event} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-foreground/60 w-32">{event}</span>
                  <div className="progress-thin flex-1">
                    <div style={{
                      width: `${Math.min(100, (count / max) * 100)}%`,
                    }} />
                  </div>
                  <span className="text-xs tabular-nums text-foreground/70 w-10 text-right">{count}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

// ---- Families Tab ----------------------------------------------------------

function FamiliesTab() {
  return (
    <div className="animate-fade-up">
      <div className="empty-state">
        <div className="empty-state-icon">
          <Users className="h-5 w-5" style={{ color: "var(--primary)" }} />
        </div>
        <div className="empty-state-title">Family Management</div>
        <div className="empty-state-body">
          Multi-tenant family management will appear here when authentication is wired.
          For now, all families share the singleton data.
        </div>
      </div>
    </div>
  );
}

// ---- Content Tab -----------------------------------------------------------

function ContentTab() {
  return (
    <div className="animate-fade-up">
      <div className="empty-state">
        <div className="empty-state-icon">
          <BookOpen className="h-5 w-5" style={{ color: "var(--primary)" }} />
        </div>
        <div className="empty-state-title">Content Management</div>
        <div className="empty-state-body">
          Lesson authoring, achievement editing, and quote management will appear here.
          Content is currently managed via seed scripts.
        </div>
      </div>
    </div>
  );
}
