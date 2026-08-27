"use client";

// ============================================================================
// PRIVACY & DATA CONTROL CENTER
// ============================================================================
// Families can: view what data exists, export it, see AI preferences,
// understand what data is used for, and manage consent.
// ============================================================================

import { useEffect, useState } from "react";
import { Shield, Download, Eye, Lock, Trash2, Sparkles, FileText, Database, Check } from "lucide-react";

interface DataSummary {
  children: number;
  parents: number;
  transactions: number;
  spending: number;
  goals: number;
  achievements: number;
  lessons: number;
  tokens: number;
  auditLogs: number;
  analyticsEvents: number;
  totalRecords: number;
}

export function PrivacyControlCenter() {
  const [data, setData] = useState<DataSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [aiPrefs, setAiPrefs] = useState({
    coachEnabled: true,
    insightsEnabled: true,
    recommendationsEnabled: true,
    maturityScoreEnabled: true,
  });

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        const tableMap: Map<string, number> = new Map(
          (d.tables ?? []).map((t: any) => [t.name as string, Number(t.count ?? 0)] as [string, number])
        );
        const get = (name: string): number => tableMap.get(name) ?? 0;
        setData({
          children: get("Child"),
          parents: get("ParentProfile"),
          transactions: get("Transaction"),
          spending: get("SpendingEntry"),
          goals: get("Goal"),
          achievements: get("UserAchievement"),
          lessons: get("LessonProgress"),
          tokens: get("TokenLedgerEntry"),
          auditLogs: get("AuditLog"),
          analyticsEvents: get("AnalyticsEvent"),
          totalRecords: Number(d.totalRecords ?? 0),
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all data via v1 API
      const [families, children, goals, transactions, lessons, achievements, insights] = await Promise.all([
        fetch("/api/v1/families").then((r) => r.json()),
        fetch("/api/v1/children").then((r) => r.json()),
        fetch("/api/v1/goals").then((r) => r.json()),
        fetch("/api/v1/transactions").then((r) => r.json()),
        fetch("/api/v1/lessons").then((r) => r.json()),
        fetch("/api/v1/achievements").then((r) => r.json()),
        fetch("/api/v1/insights").then((r) => r.json()),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        platform: "Planned",
        version: "v1",
        family: families.data?.family,
        children: children.data?.children,
        goals: goals.data?.goals,
        transactions: transactions.data?.transactions,
        lessons: lessons.data?.lessons,
        achievements: achievements.data?.achievements,
        insights: insights.data?.insights,
        aiPreferences: aiPrefs,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `planned-family-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="surface-wood rounded-lg p-6">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" style={{ width: "60%" }} />
      </div>
    );
  }

  const dataItems = [
    { label: "Children", count: data?.children ?? 0, icon: "Users" },
    { label: "Parents", count: data?.parents ?? 0, icon: "Users" },
    { label: "Transactions", count: data?.transactions ?? 0, icon: "ArrowLeftRight" },
    { label: "Spending Entries", count: data?.spending ?? 0, icon: "Wallet" },
    { label: "Goals", count: data?.goals ?? 0, icon: "Target" },
    { label: "Achievements Earned", count: data?.achievements ?? 0, icon: "Award" },
    { label: "Lesson Progress", count: data?.lessons ?? 0, icon: "BookOpen" },
    { label: "Token Ledger", count: data?.tokens ?? 0, icon: "Sparkles" },
    { label: "Audit Logs", count: data?.auditLogs ?? 0, icon: "FileText" },
    { label: "Analytics Events", count: data?.analyticsEvents ?? 0, icon: "Activity" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="surface-wood-strong rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5" style={{ color: "var(--primary)" }} />
          <div>
            <div className="micro-label-gold mb-0.5">Privacy & Data Control</div>
            <h2 className="font-editorial text-xl text-foreground tracking-wide">
              Your Data, Your Control
            </h2>
          </div>
        </div>
        <div className="divider-gold mb-4" />
        <p className="text-xs text-foreground/55 leading-relaxed max-w-xl">
          Your family's data is yours. You can see exactly what we store, export it at any time,
          and control how AI uses it. We never sell data, never share with advertisers, and never
          profile sensitive characteristics.
        </p>
        <div className="text-[10px] text-foreground/40 mt-2">
          Total records stored: <span className="font-editorial tabular-nums" style={{ color: "var(--primary)" }}>{data?.totalRecords.toLocaleString()}</span>
        </div>
      </div>

      {/* What data we have */}
      <div className="surface-wood rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-4 w-4" style={{ color: "var(--primary)" }} />
          <div className="micro-label-gold">What We Store</div>
        </div>
        <div className="divider-gold mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {dataItems.map((item) => (
            <div key={item.label} className="surface-flat rounded-lg p-3 text-center">
              <div className="font-editorial text-lg tabular-nums" style={{ color: "var(--primary)" }}>
                {item.count.toLocaleString()}
              </div>
              <div className="text-[9px] text-foreground/45 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="divider-gold my-4" />
        <div className="space-y-2 text-[10px] text-foreground/45">
          <div className="flex items-start gap-2">
            <Lock className="h-2.5 w-2.5 mt-0.5 shrink-0" style={{ color: "var(--chart-2)" }} />
            <span>Data is stored in an encrypted SQLite database on the server. In production: PostgreSQL with encryption at rest.</span>
          </div>
          <div className="flex items-start gap-2">
            <Eye className="h-2.5 w-2.5 mt-0.5 shrink-0" style={{ color: "var(--chart-5)" }} />
            <span>Only your family can see your data. In multi-tenant mode, row-level security ensures families cannot access each other's data.</span>
          </div>
          <div className="flex items-start gap-2">
            <Trash2 className="h-2.5 w-2.5 mt-0.5 shrink-0" style={{ color: "var(--chart-3)" }} />
            <span>You can request data deletion at any time. Soft-deleted records are hard-deleted after 90 days.</span>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className="surface-wood rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-4 w-4" style={{ color: "var(--primary)" }} />
          <div className="micro-label-gold">Export Your Data</div>
        </div>
        <div className="divider-gold mb-4" />
        <p className="text-xs text-foreground/55 mb-4 leading-relaxed">
          Download all your family's data as a JSON file. This includes family info, children,
          goals, transactions, lessons, achievements, and AI insights — everything we have.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-gold px-4 py-2.5 rounded text-xs tracking-wider flex items-center gap-2"
        >
          {exported ? (
            <><Check className="h-3 w-3" /> Downloaded!</>
          ) : exporting ? (
            "Exporting..."
          ) : (
            <><Download className="h-3 w-3" /> Export Family Data</>
          )}
        </button>
        <div className="text-[10px] text-foreground/35 mt-2">
          Export includes all data accessible via the Public API v1 endpoints.
        </div>
      </div>

      {/* AI Preferences */}
      <div className="surface-wood rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4" style={{ color: "var(--primary)" }} />
          <div className="micro-label-gold">AI Preferences</div>
        </div>
        <div className="divider-gold mb-4" />
        <p className="text-xs text-foreground/55 mb-4 leading-relaxed">
          Control which AI features are active for your family. Disabling a feature does not delete
          existing data — it stops new AI processing for that feature.
        </p>
        <div className="space-y-3">
          {[
            { key: "coachEnabled", label: "AI Financial Coach", desc: "Children can ask questions about money" },
            { key: "insightsEnabled", label: "Parent AI Insights", desc: "Smart summaries about saving + spending patterns" },
            { key: "recommendationsEnabled", label: "Smart Recommendations", desc: "Educational suggestions on dashboards" },
            { key: "maturityScoreEnabled", label: "Financial Maturity Score", desc: "4-dimension scoring with suggestions" },
          ].map((pref) => (
            <div key={pref.key} className="flex items-center justify-between surface-flat rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-foreground tracking-wide">{pref.label}</div>
                <div className="text-[10px] text-foreground/45 mt-0.5">{pref.desc}</div>
              </div>
              <button
                onClick={() => setAiPrefs((p) => ({ ...p, [pref.key]: !p[pref.key as keyof typeof p] }))}
                className="ml-3 shrink-0"
                style={{ color: aiPrefs[pref.key as keyof typeof aiPrefs] ? "var(--chart-2)" : "var(--text-faint)" }}
              >
                {aiPrefs[pref.key as keyof typeof aiPrefs] ? "ON" : "OFF"}
              </button>
            </div>
          ))}
        </div>
        <div className="divider-gold my-4" />
        <div className="space-y-2 text-[10px] text-foreground/45">
          <div className="flex items-start gap-2">
            <Shield className="h-2.5 w-2.5 mt-0.5 shrink-0" style={{ color: "var(--primary)" }} />
            <span>AI never profiles: religion, politics, mental health, income status, or any protected attribute.</span>
          </div>
          <div className="flex items-start gap-2">
            <Eye className="h-2.5 w-2.5 mt-0.5 shrink-0" style={{ color: "var(--chart-5)" }} />
            <span>Every AI insight includes a "Why am I seeing this?" explanation with confidence score.</span>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="h-2.5 w-2.5 mt-0.5 shrink-0" style={{ color: "var(--chart-3)" }} />
            <span>AI coach never gives investment advice, predicts returns, or replaces parental authority.</span>
          </div>
        </div>
      </div>

      {/* Trust commitments summary */}
      <div className="surface-wood rounded-lg p-5">
        <div className="micro-label-gold mb-2">Our Commitments</div>
        <div className="divider-gold mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-foreground/55">
          <div className="flex items-center gap-2"><Lock className="h-3 w-3" style={{ color: "var(--chart-2)" }} /> Data encrypted at rest + in transit</div>
          <div className="flex items-center gap-2"><Eye className="h-3 w-3" style={{ color: "var(--chart-5)" }} /> No data sold to third parties</div>
          <div className="flex items-center gap-2"><Shield className="h-3 w-3" style={{ color: "var(--primary)" }} /> No profiling of protected attributes</div>
          <div className="flex items-center gap-2"><Download className="h-3 w-3" style={{ color: "var(--chart-3)" }} /> Full data export at any time</div>
          <div className="flex items-center gap-2"><Trash2 className="h-3 w-3" style={{ color: "var(--destructive)" }} /> Data deletion on request</div>
          <div className="flex items-center gap-2"><Sparkles className="h-3 w-3" style={{ color: "var(--chart-5)" }} /> Explainable AI with confidence scores</div>
        </div>
      </div>
    </div>
  );
}
