"use client";

// ============================================================================
// ACHIEVEMENTS PANEL — badges, streaks, milestones
// ============================================================================

import { useEffect, useState } from "react";
import {
  Lock,
  Flame,
  Trophy,
  Award,
  BookOpen,
  Wallet,
  Target,
  Sparkles,
  TrendingUp,
  PiggyBank,
  GraduationCap,
} from "lucide-react";
import type { Child } from "@/lib/types";

interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  points: number;
}

interface EarnedAchievement {
  id: string;
  achievementId: string;
  achievement: Achievement;
  earnedAt: number;
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastSaveDate: number | null;
  daysUntilBreak: number;
}

const ICON_MAP: Record<string, any> = {
  PiggyBank,
  Flame,
  Trophy,
  Award,
  BookOpen,
  Wallet,
  Target,
  Sparkles,
  TrendingUp,
  GraduationCap,
};

const TIER_COLORS: Record<string, string> = {
  bronze: "#C77B4A",
  silver: "#B0B0B0",
  gold: "#D4AF37",
  platinum: "#E5E4E2",
};

export function AchievementsPanel({ child }: { child: Child }) {
  const [all, setAll] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<EarnedAchievement[]>([]);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/achievements?childId=${child.id}`)
      .then((r) => r.json())
      .then((data) => {
        setAll(data.achievements ?? []);
        setEarned(data.earned ?? []);
        setStreak(data.streak ?? null);
        setTotalPoints(data.totalPoints ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [child.id]);

  if (loading) {
    return <div className="text-center py-12 text-foreground/40 text-sm">Loading achievements...</div>;
  }

  const earnedCodes = new Set(earned.map((e) => e.achievement.code));

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Summary: streak + points */}
      <div className="grid grid-cols-3 gap-4">
        {/* Streak */}
        <div className="surface-wood-strong rounded-lg p-5 text-center">
          <Flame
            className="h-6 w-6 mx-auto mb-2"
            style={{ color: streak && streak.currentStreak > 0 ? "var(--chart-3)" : "var(--text-faint)" }}
          />
          <div className="font-editorial text-2xl text-foreground tabular-nums">
            {streak?.currentStreak ?? 0}
          </div>
          <div className="micro-label mt-1">Day streak</div>
          {streak && streak.longestStreak > 0 && (
            <div className="text-[10px] text-foreground/40 mt-1">
              Best: {streak.longestStreak} days
            </div>
          )}
        </div>

        {/* Points */}
        <div className="surface-wood-strong rounded-lg p-5 text-center">
          <Trophy
            className="h-6 w-6 mx-auto mb-2"
            style={{ color: totalPoints > 0 ? "var(--primary)" : "var(--text-faint)" }}
          />
          <div className="font-editorial text-2xl text-gold-foil-static tabular-nums">
            {totalPoints}
          </div>
          <div className="micro-label mt-1">Total points</div>
        </div>

        {/* Badges */}
        <div className="surface-wood-strong rounded-lg p-5 text-center">
          <Award
            className="h-6 w-6 mx-auto mb-2"
            style={{ color: earned.length > 0 ? "var(--chart-5)" : "var(--text-faint)" }}
          />
          <div className="font-editorial text-2xl text-foreground tabular-nums">
            {earned.length}
            <span className="text-sm text-foreground/40">/{all.length}</span>
          </div>
          <div className="micro-label mt-1">Badges earned</div>
        </div>
      </div>

      {/* Earned badges */}
      {earned.length > 0 && (
        <div>
          <h3 className="font-editorial text-lg text-foreground tracking-wide mb-4">
            Earned Badges
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 stagger">
            {earned.map((e) => {
              const Icon = ICON_MAP[e.achievement.icon] ?? Award;
              const tierColor = TIER_COLORS[e.achievement.tier] ?? "var(--primary)";
              return (
                <div
                  key={e.id}
                  className="surface-wood rounded-lg p-4 card-hover"
                  style={{ borderColor: `color-mix(in srgb, ${tierColor} 30%, var(--hairline))` }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${tierColor} 15%, transparent)`,
                        border: `1px solid ${tierColor}`,
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: tierColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-editorial text-sm text-foreground tracking-wide">
                        {e.achievement.title}
                      </div>
                      <div className="text-[10px] text-foreground/50 mt-0.5 leading-snug">
                        {e.achievement.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="pill"
                          style={{
                            fontSize: 8,
                            background: `color-mix(in srgb, ${tierColor} 12%, transparent)`,
                            color: tierColor,
                            border: `1px solid color-mix(in srgb, ${tierColor} 30%, transparent)`,
                          }}
                        >
                          {e.achievement.tier}
                        </span>
                        <span className="text-[10px] text-foreground/40">+{e.achievement.points} pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {all.filter((a) => !earnedCodes.has(a.code)).length > 0 && (
        <div>
          <h3 className="font-editorial text-lg text-foreground tracking-wide mb-4">
            Locked
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {all
              .filter((a) => !earnedCodes.has(a.code))
              .map((a) => {
                const Icon = ICON_MAP[a.icon] ?? Award;
                return (
                  <div
                    key={a.id}
                    className="surface-flat rounded-lg p-4 opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: "var(--surface-flat-bg)",
                          border: "1px solid var(--hairline)",
                        }}
                      >
                        <Lock className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-editorial text-sm text-foreground/70 tracking-wide">
                          {a.title}
                        </div>
                        <div className="text-[10px] text-foreground/40 mt-0.5 leading-snug">
                          {a.description}
                        </div>
                        <div className="text-[10px] text-foreground/30 mt-2">
                          +{a.points} pts
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
