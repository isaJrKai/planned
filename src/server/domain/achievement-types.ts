// ============================================================================
// ACHIEVEMENT DOMAIN — Types
// ============================================================================

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;        // lucide icon name
  category: AchievementCategory;
  tier: AchievementTier;
  points: number;
  requirement: AchievementRequirement;
}

export type AchievementCategory =
  | "savings"
  | "spending"
  | "goals"
  | "tokens"
  | "education"
  | "streaks";

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

export interface AchievementRequirement {
  type:
    | "total_saved"
    | "savings_count"
    | "streak_days"
    | "goals_completed"
    | "first_save"
    | "first_goal"
    | "lessons_completed"
    | "spend_under_budget"
    | "token_redeemed"
    | "investments_made";
  threshold: number;
  metadata?: Record<string, any>;
}

export interface EarnedAchievement {
  id: string;
  achievementId: string;
  achievement: Achievement;
  earnedAt: number;
  metadata?: Record<string, any>;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastSaveDate: number | null;
  daysUntilBreak: number; // hours until streak breaks if no save
}
