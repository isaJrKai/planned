"use client";

// ============================================================================
// AUDIT LOG — security audit trail visible in admin panel
// ============================================================================

import { useEffect, useState } from "react";
import { Shield, Search, Filter, Download, FileText } from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

const ACTION_COLORS: Record<string, string> = {
  save_money: "var(--chart-2)",
  log_spending: "var(--chart-3)",
  token_award: "var(--primary)",
  token_redeem: "var(--chart-5)",
  coach_query: "var(--chart-4)",
  LOGIN: "var(--chart-2)",
  LOGOUT: "var(--text-softer)",
  CREATE: "var(--primary)",
  UPDATE: "var(--chart-3)",
  DELETE: "var(--destructive)",
};

export function AuditLogTab() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/v1/audit?limit=100")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.data?.logs ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const actions = Array.from(new Set(logs.map((l) => l.action)));
  const filtered = logs.filter((l) => {
    if (filter !== "all" && l.action !== filter) return false;
    if (search && !l.action.toLowerCase().includes(search.toLowerCase()) && !l.actor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planned-audit-log-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-12 text-foreground/40 text-sm">Loading audit log...</div>;
  }

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="micro-label-gold mb-1 flex items-center gap-1.5">
            <Shield className="h-3 w-3" /> Security Audit Log
          </div>
          <h3 className="font-editorial text-lg text-foreground tracking-wide">
            Activity Trail
          </h3>
        </div>
        <button
          onClick={handleExport}
          className="btn-outline px-3 py-1.5 rounded text-xs tracking-wider flex items-center gap-2"
        >
          <Download className="h-3 w-3" /> Export
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action or actor..."
            className="input-editorial w-full pl-9 pr-3 py-2 text-xs"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-editorial px-3 py-2 text-xs"
        >
          <option value="all">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[10px] text-foreground/40">
        <span><FileText className="h-2.5 w-2.5 inline mr-1" /> {filtered.length} entries shown</span>
        <span>·</span>
        <span>{actions.length} unique action types</span>
      </div>

      {/* Log entries */}
      <div className="surface-wood rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Shield className="h-5 w-5" style={{ color: "var(--primary)" }} />
            </div>
            <div className="empty-state-title">No audit entries</div>
            <div className="empty-state-body">
              No activity has been logged yet. Audit entries appear when users save money, log spending, award tokens, or ask the AI coach.
            </div>
          </div>
        ) : (
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Details</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((log) => {
                const color = ACTION_COLORS[log.action] ?? "var(--text-softer)";
                const date = new Date(log.timestamp);
                return (
                  <tr key={log.id}>
                    <td className="text-foreground/40 text-[10px] tabular-nums whitespace-nowrap">
                      {date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      {" "}
                      {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td>
                      <span
                        className="pill"
                        style={{
                          fontSize: 8,
                          background: `color-mix(in srgb, ${color} 12%, transparent)`,
                          color,
                          border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="text-[10px] font-mono text-foreground/50">
                      {log.actor === "system" ? "—" : log.actor.slice(0, 12)}
                    </td>
                    <td className="text-[10px] text-foreground/40 max-w-[200px] truncate">
                      {Object.keys(log.details).length > 0
                        ? JSON.stringify(log.details).slice(0, 80)
                        : "—"}
                    </td>
                    <td className="text-[9px] text-foreground/30 font-mono">
                      {log.ipAddress?.slice(0, 15) || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 50 && (
        <div className="text-center text-[10px] text-foreground/40">
          Showing 50 of {filtered.length} entries. Export for full log.
        </div>
      )}
    </div>
  );
}
