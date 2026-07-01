"use client";

// ============================================================================
// GOALS — flexible savings/spend-less goals with privacy + cadence
// ============================================================================
// Features:
//   - Owner: parent (Mum/Dad) or child
//   - Type: "save" (build toward target) or "spend_less" (stay under budget cap)
//   - Cadence: weekly / monthly / annual (auto-resets the period)
//   - Privacy: private (owner only) or revealed (whole family sees it)
//   - Cap: max 15 per owner (enforced in store)
//   - Display: tabular with graph progress (animated SVG progress bars)
// ============================================================================

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Target,
  TrendingDown,
  Lock,
  Globe,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  addGoal as persistAddGoal,
  updateGoal as persistUpdateGoal,
  deleteGoal as persistDeleteGoal,
  contributeToGoal as persistContribute,
} from "@/lib/mutations";
import { formatUGX, formatUGXPlain } from "@/lib/phrases";
import type {
  Goal,
  GoalCadence,
  GoalType,
  GoalVisibility,
  ParentProfile,
  Child,
} from "@/lib/types";
import { Avatar } from "./avatar";

// ---- Helpers ---------------------------------------------------------------

function cadenceLabel(c: GoalCadence): string {
  return c === "weekly" ? "Weekly" : c === "monthly" ? "Monthly" : "Annual";
}

function periodEndLabel(start: number, cadence: GoalCadence): string {
  const d = new Date(start);
  if (cadence === "weekly") {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  }
  if (cadence === "monthly") {
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  }
  return `${d.getFullYear()}`;
}

function goalProgressPct(g: Goal): number {
  if (g.targetAmount <= 0) return 0;
  if (g.type === "save") {
    return Math.min(100, (g.currentAmount / g.targetAmount) * 100);
  }
  // spend_less: progress = how much of the cap is left (so 100% = fully under budget)
  // But for "progress" we want to show spent/cap (so 0% = nothing spent, 100% = at cap)
  return Math.min(100, (g.currentAmount / g.targetAmount) * 100);
}

function goalStatusTone(g: Goal): "good" | "warning" | "danger" {
  const pct = goalProgressPct(g);
  if (g.type === "save") {
    if (pct >= 100) return "good";
    if (pct >= 50) return "good";
    return "warning";
  }
  // spend_less
  if (pct >= 100) return "danger"; // over budget
  if (pct >= 80) return "warning"; // close to cap
  return "good";
}

// ---- Goal Modal — create or edit ------------------------------------------

interface GoalDraft {
  ownerId: string;
  ownerKind: "parent" | "child";
  ownerName: string;
  title: string;
  type: GoalType;
  cadence: GoalCadence;
  visibility: GoalVisibility;
  targetAmount: number;
  note?: string;
}

export function GoalModal({
  onClose,
  editGoal,
  defaultOwnerId,
}: {
  onClose: () => void;
  editGoal?: Goal;
  defaultOwnerId?: string;
}) {
  const parents = useStore((s) => s.parents);
  const children = useStore((s) => s.children);
  // addGoal + updateGoal come from persisted mutations module

  const [draft, setDraft] = useState<GoalDraft>(() => {
    if (editGoal) {
      const { id, createdAt, periodStart, currentAmount, ...rest } = editGoal;
      return { ...rest };
    }
    const defaultOwner =
      parents.find((p) => p.id === defaultOwnerId) ??
      parents[0] ??
      children[0];
    return {
      ownerId: defaultOwner.id,
      ownerKind: parents.find((p) => p.id === defaultOwner.id) ? "parent" : "child",
      ownerName:
        parents.find((p) => p.id === defaultOwner.id)?.name ??
        children.find((c) => c.id === defaultOwner.id)?.name ??
        "",
      title: "",
      type: "save",
      cadence: "monthly",
      visibility: "revealed",
      targetAmount: 0,
    };
  });

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const allOwners: { id: string; kind: "parent" | "child"; name: string }[] = [
    ...parents.map((p) => ({ id: p.id, kind: "parent" as const, name: `${p.name} (${p.role})` })),
    ...children.map((c) => ({ id: c.id, kind: "child" as const, name: `${c.name} (Child)` })),
  ];

  const handleOwnerChange = (id: string) => {
    const owner = allOwners.find((o) => o.id === id);
    if (owner) {
      setDraft((d) => ({ ...d, ownerId: id, ownerKind: owner.kind, ownerName: owner.name.split(" (")[0] }));
    }
  };

  const handleSubmit = () => {
    if (!draft.title.trim()) {
      setError("Please give your goal a title.");
      return;
    }
    if (draft.targetAmount <= 0) {
      setError("Target amount must be greater than zero.");
      return;
    }
    if (editGoal) {
      persistUpdateGoal(editGoal.id, {
        title: draft.title.trim(),
        type: draft.type,
        cadence: draft.cadence,
        visibility: draft.visibility,
        targetAmount: draft.targetAmount,
        note: draft.note,
      });
    } else {
      const result = persistAddGoal({
        ownerId: draft.ownerId,
        ownerKind: draft.ownerKind,
        ownerName: draft.ownerName,
        title: draft.title.trim(),
        type: draft.type,
        cadence: draft.cadence,
        visibility: draft.visibility,
        targetAmount: draft.targetAmount,
        currentAmount: 0,
        note: draft.note,
      });
      if (!result.ok) {
        setError(result.error ?? "Could not create goal.");
        return;
      }
    }
    setSaved(true);
    setTimeout(onClose, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-up"
      style={{
        background: "radial-gradient(80% 80% at 50% 50%, rgba(9,12,10,0.85) 0%, rgba(9,12,10,0.96) 100%)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="surface-wood-strong rounded-lg w-full max-w-lg shadow-2xl"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px var(--hairline-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-foreground/40 hover:text-foreground/80 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="micro-label-gold mb-2">
            {editGoal ? "Edit Goal" : "New Goal"}
          </div>
          <h2 className="font-editorial text-2xl text-foreground tracking-editorial leading-tight">
            {editGoal ? "Update Your Goal" : "Set a New Goal"}
          </h2>
          <div className="divider-gold mt-5" />
        </div>

        {/* Body */}
        <div className="px-7 py-5 space-y-5">
          {/* Owner */}
          {!editGoal && (
            <div>
              <label className="micro-label block mb-2">Owner</label>
              <select
                value={draft.ownerId}
                onChange={(e) => handleOwnerChange(e.target.value)}
                className="input-editorial w-full px-4 py-2.5 text-sm"
              >
                {allOwners.map((o) => (
                  <option key={o.id} value={o.id} className="bg-sidebar text-sidebar-foreground">
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="micro-label block mb-2">Goal Title</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="e.g. Emergency Fund · New Bicycle · Spend Less on Snacks"
              maxLength={80}
              autoFocus
              className="input-editorial w-full px-4 py-2.5 text-sm"
            />
          </div>

          {/* Type */}
          <div>
            <label className="micro-label block mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDraft((d) => ({ ...d, type: "save" }))}
                className={`px-4 py-3 rounded text-left transition-all ${
                  draft.type === "save" ? "btn-gold" : "btn-outline"
                }`}
              >
                <Target className="h-3.5 w-3.5 mb-1.5" />
                <div className="text-xs tracking-wider uppercase">Save</div>
                <div className="text-[10px] opacity-70 mt-0.5">Build toward a target</div>
              </button>
              <button
                onClick={() => setDraft((d) => ({ ...d, type: "spend_less" }))}
                className={`px-4 py-3 rounded text-left transition-all ${
                  draft.type === "spend_less" ? "btn-gold" : "btn-outline"
                }`}
              >
                <TrendingDown className="h-3.5 w-3.5 mb-1.5" />
                <div className="text-xs tracking-wider uppercase">Spend Less</div>
                <div className="text-[10px] opacity-70 mt-0.5">Stay under a budget cap</div>
              </button>
            </div>
          </div>

          {/* Cadence */}
          <div>
            <label className="micro-label block mb-2">Cadence</label>
            <div className="grid grid-cols-3 gap-2">
              {(["weekly", "monthly", "annual"] as GoalCadence[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setDraft((d) => ({ ...d, cadence: c }))}
                  className={`px-3 py-2 rounded text-xs tracking-wider uppercase transition-all ${
                    draft.cadence === c ? "btn-gold" : "btn-outline"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          <div>
            <label className="micro-label block mb-2">
              {draft.type === "save" ? "Target Amount (UGX)" : "Budget Cap (UGX)"}
            </label>
            <input
              type="number"
              value={draft.targetAmount || ""}
              onChange={(e) => setDraft((d) => ({ ...d, targetAmount: Number(e.target.value) || 0 }))}
              placeholder="0"
              className="input-editorial w-full px-4 py-3 font-editorial text-2xl tabular-nums"
            />
            <div className="micro-label mt-1.5">
              {draft.type === "save"
                ? `Save up to this amount · ${cadenceLabel(draft.cadence).toLowerCase()}`
                : `Cap spending at this amount · ${cadenceLabel(draft.cadence).toLowerCase()}`}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="micro-label block mb-2">Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDraft((d) => ({ ...d, visibility: "revealed" }))}
                className={`px-4 py-3 rounded text-left transition-all ${
                  draft.visibility === "revealed" ? "btn-gold" : "btn-outline"
                }`}
              >
                <Globe className="h-3.5 w-3.5 mb-1.5" />
                <div className="text-xs tracking-wider uppercase">Revealed</div>
                <div className="text-[10px] opacity-70 mt-0.5">Whole family sees it</div>
              </button>
              <button
                onClick={() => setDraft((d) => ({ ...d, visibility: "private" }))}
                className={`px-4 py-3 rounded text-left transition-all ${
                  draft.visibility === "private" ? "btn-gold" : "btn-outline"
                }`}
              >
                <Lock className="h-3.5 w-3.5 mb-1.5" />
                <div className="text-xs tracking-wider uppercase">Private</div>
                <div className="text-[10px] opacity-70 mt-0.5">Only you can see it</div>
              </button>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="micro-label block mb-2">Note (optional)</label>
            <input
              type="text"
              value={draft.note ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              placeholder="e.g. Six months of family expenses"
              maxLength={120}
              className="input-editorial w-full px-4 py-2.5 text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--chart-3)" }}>
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 pt-3">
          <div className="divider-gold mb-4" />
          {saved ? (
            <div className="flex items-center gap-3" style={{ color: "var(--chart-2)" }}>
              <Check className="h-4 w-4" />
              <span className="micro-label" style={{ color: "var(--chart-2)" }}>
                Goal {editGoal ? "updated" : "created"}
              </span>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-ghost flex-1 px-4 py-2.5 rounded text-sm">
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn-gold flex-1 px-4 py-2.5 rounded text-sm">
                {editGoal ? "Update Goal" : "Create Goal"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Contribute Modal — add to a savings goal -----------------------------

export function ContributeModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  // contribute comes from persisted mutations module
  const [amount, setAmount] = useState("");
  const [saved, setSaved] = useState(false);

  const amt = Number(amount) || 0;

  const handleSubmit = () => {
    if (amt <= 0) return;
    persistContribute(goal.id, amt);
    setSaved(true);
    setTimeout(onClose, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-up"
      style={{
        background: "radial-gradient(80% 80% at 50% 50%, rgba(9,12,10,0.85) 0%, rgba(9,12,10,0.96) 100%)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="surface-wood-strong rounded-lg w-full max-w-md shadow-2xl"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px var(--hairline-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-7 pt-7 pb-5 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-foreground/40 hover:text-foreground/80"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="micro-label-gold mb-2">Contribute to Goal</div>
          <h2 className="font-editorial text-xl text-foreground tracking-wide">{goal.title}</h2>
          <div className="divider-gold mt-5" />
        </div>
        <div className="px-7 py-5 space-y-4">
          <div className="surface-flat rounded p-4 flex justify-between">
            <div>
              <div className="micro-label mb-1">Current Progress</div>
              <div className="font-editorial text-base tabular-nums text-foreground">
                {formatUGX(goal.currentAmount)}
              </div>
            </div>
            <div className="text-right">
              <div className="micro-label mb-1">Target</div>
              <div className="font-editorial text-base tabular-nums text-foreground/70">
                {formatUGX(goal.targetAmount)}
              </div>
            </div>
          </div>
          <div>
            <label className="micro-label block mb-2">Amount (UGX)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
              className="input-editorial w-full px-4 py-3 font-editorial text-2xl tabular-nums"
            />
          </div>
        </div>
        <div className="px-7 pb-7 pt-3">
          <div className="divider-gold mb-4" />
          {saved ? (
            <div className="flex items-center gap-3" style={{ color: "var(--chart-2)" }}>
              <Check className="h-4 w-4" />
              <span className="micro-label" style={{ color: "var(--chart-2)" }}>
                Contributed · goal updated
              </span>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-ghost flex-1 px-4 py-2.5 rounded text-sm">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={amt <= 0}
                className="btn-gold flex-1 px-4 py-2.5 rounded text-sm"
              >
                Add {amt > 0 && `· UGX ${formatUGXPlain(amt)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Goal Row — single row in the tabular view -----------------------------

function GoalRow({
  goal,
  owners,
  onContribute,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  owners: { id: string; kind: "parent" | "child"; name: string; color: string; photo?: string }[];
  onContribute: (g: Goal) => void;
  onEdit: (g: Goal) => void;
  onDelete: (g: Goal) => void;
}) {
  const owner = owners.find((o) => o.id === goal.ownerId);
  const pct = goalProgressPct(goal);
  const tone = goalStatusTone(goal);
  const toneColor =
    tone === "good" ? "var(--chart-2)" : tone === "warning" ? "var(--chart-3)" : "var(--destructive)";

  return (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          {owner && (
            <Avatar name={owner.name} color={owner.color} photo={owner.photo} size={28} />
          )}
          <div className="min-w-0">
            <div className="font-editorial text-sm tracking-wide text-foreground truncate">
              {goal.title}
            </div>
            {goal.note && (
              <div className="micro-label mt-0.5 truncate">{goal.note}</div>
            )}
          </div>
        </div>
      </td>
      <td className="text-foreground/70 text-xs">{owner?.name ?? "—"}</td>
      <td>
        <span className={`pill ${goal.type === "save" ? "pill-gold" : "pill-amber"}`}>
          {goal.type === "save" ? "Save" : "Spend Less"}
        </span>
      </td>
      <td>
        <span className="pill pill-muted">{cadenceLabel(goal.cadence)}</span>
      </td>
      <td>
        <span
          className={`pill ${goal.visibility === "revealed" ? "pill-green" : "pill-muted"}`}
        >
          {goal.visibility === "revealed" ? (
            <>
              <Globe className="h-2.5 w-2.5" /> Revealed
            </>
          ) : (
            <>
              <Lock className="h-2.5 w-2.5" /> Private
            </>
          )}
        </span>
      </td>
      <td className="text-right tabular-nums font-editorial text-foreground">
        {formatUGXPlain(goal.targetAmount)}
      </td>
      <td className="text-right tabular-nums text-foreground/70">
        {formatUGXPlain(goal.currentAmount)}
      </td>
      <td>
        <div className="flex items-center gap-2">
          <div className="progress-thin flex-1 min-w-[80px]">
            <div
              style={{
                width: `${pct}%`,
                background:
                  tone === "good"
                    ? "linear-gradient(90deg, var(--primary), var(--chart-5))"
                    : `linear-gradient(90deg, ${toneColor}, ${toneColor})`,
              }}
            />
          </div>
          <span
            className="text-xs tabular-nums w-10 text-right"
            style={{ color: toneColor }}
          >
            {pct.toFixed(0)}%
          </span>
        </div>
        <div className="micro-label mt-1">
          {periodEndLabel(goal.periodStart, goal.cadence)}
        </div>
      </td>
      <td className="text-right">
        <div className="flex items-center gap-1 justify-end">
          {goal.type === "save" && (
            <button
              onClick={() => onContribute(goal)}
              className="btn-outline px-2 py-1 rounded text-[10px] tracking-wider"
              title="Contribute"
            >
              + Add
            </button>
          )}
          <button
            onClick={() => onEdit(goal)}
            className="btn-ghost p-1.5 rounded"
            title="Edit"
          >
            <Target className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(goal)}
            className="btn-ghost p-1.5 rounded"
            title="Delete"
            style={{ color: "var(--destructive)" }}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---- GoalsTab — main tabular view with summary + filter + graph ------------

export function GoalsTab({
  parents,
  childList,
  viewerId,
}: {
  parents: ParentProfile[];
  childList: Child[];
  viewerId?: string; // if set, only show goals visible to this viewer
}) {
  const goals = useStore((s) => s.goals);
  const children = childList;
  // deleteGoal comes from persisted mutations module
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "save" | "spend_less">("all");
  const [confirmDelete, setConfirmDelete] = useState<Goal | null>(null);

  const owners = useMemo(
    () => [
      ...parents.map((p) => ({ id: p.id, kind: "parent" as const, name: p.name, color: p.avatarColor, photo: p.avatarPhoto })),
      ...children.map((c) => ({ id: c.id, kind: "child" as const, name: c.name, color: c.avatarColor, photo: c.avatarPhoto })),
    ],
    [parents, children]
  );

  // Filter goals — viewer sees their own private goals + all revealed goals.
  const visibleGoals = useMemo(() => {
    return goals.filter((g) => {
      if (g.visibility === "private" && viewerId && g.ownerId !== viewerId) {
        return false;
      }
      if (filterOwner !== "all" && g.ownerId !== filterOwner) return false;
      if (filterType !== "all" && g.type !== filterType) return false;
      return true;
    });
  }, [goals, viewerId, filterOwner, filterType]);

  // Summary stats
  const summary = useMemo(() => {
    const total = visibleGoals.length;
    const saveGoals = visibleGoals.filter((g) => g.type === "save");
    const spendLessGoals = visibleGoals.filter((g) => g.type === "spend_less");
    const totalTarget = saveGoals.reduce((s, g) => s + g.targetAmount, 0);
    const totalProgress = saveGoals.reduce((s, g) => s + g.currentAmount, 0);
    const onTrackCount = visibleGoals.filter((g) => goalStatusTone(g) === "good").length;
    return { total, saveCount: saveGoals.length, spendLessCount: spendLessGoals.length, totalTarget, totalProgress, onTrackCount };
  }, [visibleGoals]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="micro-label-gold mb-1">Family Goals</div>
          <h2 className="font-editorial text-2xl text-foreground tracking-wide">
            Goals &amp; Resolutions
          </h2>
          <p className="text-xs text-foreground/55 mt-1 max-w-xl leading-relaxed">
            Save toward targets, or commit to spending less. Set weekly, monthly,
            or annual cadences. Mark private to keep a goal just for yourself,
            or revealed so the whole family can encourage you.
          </p>
        </div>
        <button
          onClick={() => {
            setEditGoal(null);
            setShowModal(true);
          }}
          className="btn-gold px-4 py-2 rounded text-xs tracking-wider flex items-center gap-2"
        >
          <Plus className="h-3 w-3" /> New Goal
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="surface-wood rounded-lg p-4">
          <div className="micro-label mb-2">Total Goals</div>
          <div className="font-editorial text-2xl text-foreground tabular-nums">{summary.total}</div>
          <div className="micro-label mt-1">{summary.saveCount} save · {summary.spendLessCount} spend less</div>
        </div>
        <div className="surface-wood rounded-lg p-4">
          <div className="micro-label mb-2">On Track</div>
          <div className="font-editorial text-2xl tabular-nums" style={{ color: "var(--chart-2)" }}>
            {summary.onTrackCount}
          </div>
          <div className="micro-label mt-1">of {summary.total} total</div>
        </div>
        <div className="surface-wood rounded-lg p-4">
          <div className="micro-label mb-2">Saved Toward Goals</div>
          <div className="font-editorial text-2xl text-gold-foil-static tabular-nums">
            {formatUGXPlain(summary.totalProgress)}
          </div>
          <div className="micro-label mt-1">of {formatUGXPlain(summary.totalTarget)} target</div>
        </div>
        <div className="surface-wood rounded-lg p-4">
          <div className="micro-label mb-2">Family Progress</div>
          <div className="progress-thin mt-2">
            <div
              style={{
                width: `${summary.totalTarget > 0 ? Math.min(100, (summary.totalProgress / summary.totalTarget) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="micro-label mt-1.5 tabular-nums">
            {summary.totalTarget > 0
              ? ((summary.totalProgress / summary.totalTarget) * 100).toFixed(1)
              : "0.0"}
            % of total target
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="micro-label">Owner:</span>
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="input-editorial px-3 py-1.5 text-xs"
          >
            <option value="all" className="bg-sidebar text-sidebar-foreground">All Family</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id} className="bg-sidebar text-sidebar-foreground">
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="micro-label">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="input-editorial px-3 py-1.5 text-xs"
          >
            <option value="all" className="bg-sidebar text-sidebar-foreground">All</option>
            <option value="save" className="bg-sidebar text-sidebar-foreground">Save</option>
            <option value="spend_less" className="bg-sidebar text-sidebar-foreground">Spend Less</option>
          </select>
        </div>
        <span className="micro-label ml-auto">{visibleGoals.length} of {goals.length} shown</span>
      </div>

      {/* Tabular view with graph progress column */}
      <div className="surface-wood rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Goal</th>
                <th>Owner</th>
                <th>Type</th>
                <th>Cadence</th>
                <th>Visibility</th>
                <th className="text-right">Target</th>
                <th className="text-right">Current</th>
                <th>Progress</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleGoals.map((g) => (
                <GoalRow
                  key={g.id}
                  goal={g}
                  owners={owners}
                  onContribute={(goal) => setContributeGoal(goal)}
                  onEdit={(goal) => {
                    setEditGoal(goal);
                    setShowModal(true);
                  }}
                  onDelete={(goal) => setConfirmDelete(goal)}
                />
              ))}
              {visibleGoals.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-foreground/40 py-12">
                    No goals yet — click &ldquo;New Goal&rdquo; to set your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-owner progress graph — bar chart summary */}
      <div className="surface-wood rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="micro-label-gold mb-1">Progress by Family Member</div>
            <h3 className="font-editorial text-base text-foreground tracking-wide">
              How Everyone Is Doing
            </h3>
          </div>
        </div>
        <div className="divider-gold mb-5" />
        <div className="space-y-4">
          {owners.map((owner) => {
            const ownerGoals = visibleGoals.filter((g) => g.ownerId === owner.id);
            if (ownerGoals.length === 0) return null;
            const totalTarget = ownerGoals.reduce((s, g) => s + g.targetAmount, 0);
            const totalCurrent = ownerGoals.reduce((s, g) => s + g.currentAmount, 0);
            const pct = totalTarget > 0 ? Math.min(100, (totalCurrent / totalTarget) * 100) : 0;
            return (
              <div key={owner.id} className="flex items-center gap-4">
                <Avatar name={owner.name} color={owner.color} photo={owner.photo} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <div className="text-sm text-foreground tracking-wide truncate">{owner.name}</div>
                    <div className="text-xs tabular-nums text-foreground/60">
                      {formatUGXPlain(totalCurrent)} / {formatUGXPlain(totalTarget)}
                    </div>
                  </div>
                  <div className="progress-thin">
                    <div style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div
                  className="font-editorial text-sm tabular-nums w-12 text-right"
                  style={{ color: "var(--primary)" }}
                >
                  {pct.toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <GoalModal
          onClose={() => {
            setShowModal(false);
            setEditGoal(null);
          }}
          editGoal={editGoal ?? undefined}
          defaultOwnerId={viewerId}
        />
      )}
      {contributeGoal && (
        <ContributeModal
          goal={contributeGoal}
          onClose={() => setContributeGoal(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmDeleteModal
          goal={confirmDelete}
          onConfirm={() => {
            persistDeleteGoal(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ---- Confirm Delete Modal --------------------------------------------------

function ConfirmDeleteModal({
  goal,
  onConfirm,
  onCancel,
}: {
  goal: Goal;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-up"
      style={{
        background: "radial-gradient(80% 80% at 50% 50%, rgba(9,12,10,0.85) 0%, rgba(9,12,10,0.96) 100%)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onCancel}
    >
      <div
        className="surface-wood-strong rounded-lg w-full max-w-sm shadow-2xl p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="micro-label-gold mb-2">Confirm Delete</div>
        <h2 className="font-editorial text-xl text-foreground tracking-wide mb-2">
          Delete &ldquo;{goal.title}&rdquo;?
        </h2>
        <p className="text-xs text-foreground/60 mb-5 leading-relaxed">
          This will permanently remove the goal. Any progress saved toward it
          will remain in the family savings balance, but the goal itself cannot
          be restored.
        </p>
        <div className="divider-gold mb-4" />
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1 px-4 py-2.5 rounded text-sm">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded text-sm font-medium tracking-wide"
            style={{
              background: "var(--destructive)",
              color: "white",
            }}
          >
            Delete Goal
          </button>
        </div>
      </div>
    </div>
  );
}
