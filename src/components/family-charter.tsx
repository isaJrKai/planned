"use client";

// ============================================================================
// FAMILY CHARTER — define family financial values, principles, and house rules
// ============================================================================

import { useEffect, useState } from "react";
import { Scroll, Save, Check, History, FileText } from "lucide-react";

interface Charter {
  id: string;
  version: number;
  mission: string;
  savingPrinciples: string;
  spendingPrinciples: string;
  goalPrinciples: string;
  investmentPrinciples: string;
  houseRules: string;
  sharedCommitments: string;
  updatedAt: string;
}

const FIELDS: { key: keyof Charter; label: string; placeholder: string; icon: any }[] = [
  { key: "mission", label: "Family Mission", placeholder: "What does your family believe about money?", icon: Scroll },
  { key: "savingPrinciples", label: "Saving Principles", placeholder: "How does your family approach saving?", icon: FileText },
  { key: "spendingPrinciples", label: "Spending Principles", placeholder: "What guides your spending decisions?", icon: FileText },
  { key: "goalPrinciples", label: "Goal Principles", placeholder: "How do you set and pursue goals together?", icon: FileText },
  { key: "investmentPrinciples", label: "Investment Principles", placeholder: "What do you believe about investing?", icon: FileText },
  { key: "houseRules", label: "House Rules", placeholder: "What are your family's money rules?", icon: FileText },
  { key: "sharedCommitments", label: "Shared Commitments", placeholder: "What does your family commit to?", icon: FileText },
];

export function FamilyCharterEditor() {
  const [charter, setCharter] = useState<Charter | null>(null);
  const [draft, setDraft] = useState<Partial<Charter>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch("/api/charter")
      .then((r) => r.json())
      .then((data) => {
        if (data.charter) {
          setCharter(data.charter);
          setDraft(data.charter);
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/charter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (data.ok) {
        setSaved(true);
        setDirty(false);
        setTimeout(() => setSaved(false), 2000);
        // Reload to get new version
        fetch("/api/charter")
          .then((r) => r.json())
          .then((data) => {
            if (data.charter) {
              setCharter(data.charter);
              setDraft(data.charter);
            }
          });
      }
    } catch {
      // Silent fail
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof Charter, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  if (loading) {
    return (
      <div className="surface-wood rounded-lg p-6">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" style={{ width: "80%" }} />
      </div>
    );
  }

  return (
    <div className="surface-wood rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="micro-label-gold mb-1 flex items-center gap-1.5">
            <Scroll className="h-3 w-3" /> Family Charter
          </div>
          <h2 className="font-editorial text-xl text-foreground tracking-wide">
            Our Family Financial Charter
          </h2>
          <p className="text-xs text-foreground/55 mt-1 max-w-md leading-relaxed">
            Define your family's money values, principles, and house rules. Children see this on their dashboard — it reinforces shared commitments.
          </p>
        </div>
        {charter && (
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-[10px] text-foreground/40">
              <History className="h-2.5 w-2.5" />
              v{charter.version}
            </div>
            <div className="text-[9px] text-foreground/30 mt-0.5">
              {new Date(charter.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        )}
      </div>

      <div className="divider-gold mb-5" />

      <div className="space-y-5">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label className="micro-label block mb-2 flex items-center gap-1.5">
              <field.icon className="h-2.5 w-2.5" style={{ color: "var(--primary)" }} />
              {field.label}
            </label>
            <textarea
              value={draft[field.key] ?? ""}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={2}
              maxLength={500}
              className="input-editorial w-full px-4 py-2.5 text-sm leading-relaxed resize-none"
            />
          </div>
        ))}
      </div>

      <div className="divider-gold my-5" />

      <div className="flex justify-between items-center">
        <span className="micro-label">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="btn-gold px-4 py-2 rounded text-xs tracking-wider flex items-center gap-2"
        >
          {saved ? (
            <><Check className="h-3 w-3" /> Saved!</>
          ) : saving ? (
            "Saving..."
          ) : (
            <><Save className="h-3 w-3" /> Save Charter</>
          )}
        </button>
      </div>
    </div>
  );
}

// ---- Read-only charter display for child dashboard -------------------------

export function FamilyCharterDisplay({ childName }: { childName: string }) {
  const [charter, setCharter] = useState<Charter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/charter")
      .then((r) => r.json())
      .then((data) => {
        if (data.charter) setCharter(data.charter);
        setLoading(false);
      });
  }, []);

  if (loading || !charter) return null;

  const sections: { label: string; content: string }[] = [
    { label: "Our Mission", content: charter.mission },
    { label: "Saving Principles", content: charter.savingPrinciples },
    { label: "Spending Principles", content: charter.spendingPrinciples },
    { label: "Goal Principles", content: charter.goalPrinciples },
    { label: "House Rules", content: charter.houseRules },
    { label: "Our Commitments", content: charter.sharedCommitments },
  ].filter((s) => s.content && s.content.trim().length > 0);

  if (sections.length === 0) return null;

  return (
    <footer className="mt-12 mb-6">
      <div className="family-banner surface-wood-strong rounded-lg p-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Scroll className="h-3 w-3" style={{ color: "var(--primary)" }} />
          <span className="micro-label-gold">The {childName.split(" ")[0]} Family Charter</span>
        </div>
        <div className="ornamental-rule max-w-md mx-auto mb-6">
          <span className="ornamental-diamond" />
        </div>
        <div className="space-y-5 max-w-2xl mx-auto">
          {sections.map((s, i) => (
            <div key={i} className="text-center">
              <div className="micro-label mb-2">{s.label}</div>
              <p
                className="font-editorial italic text-sm md:text-base leading-relaxed"
                style={{ color: "var(--text-soft)" }}
              >
                {s.content}
              </p>
            </div>
          ))}
        </div>
        <div className="ornamental-rule max-w-md mx-auto mt-6">
          <span className="ornamental-diamond" />
        </div>
        <div className="micro-label mt-4 text-center">
          Version {charter.version} · Set by your family
        </div>
      </div>
    </footer>
  );
}
