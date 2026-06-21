// ============================================================================
// DOMAIN EVENT CATALOG
// ============================================================================
// Every state change in the system emits a domain event. Events are the
// backbone of the recommendation engine, achievement engine, notification
// system, and audit trail.
//
// Events are published via EventBus and consumed by subscribers.
// Publishers: Services (SavingsService, GoalService, etc.)
// Subscribers: AchievementService, NotificationService, AuditService,
//              RecommendationService, AnalyticsService
// ============================================================================

export type DomainEvent =
  // Family events
  | { type: "FamilyCreated"; familyId: string; name: string; createdAt: number }
  | { type: "FamilyThemeChanged"; familyId: string; oldTheme: string; newTheme: string }
  | { type: "FamilyQuoteChanged"; familyId: string; oldQuote: string; newQuote: string }

  // Child events
  | { type: "ChildCreated"; familyId: string; childId: string; name: string; age: number }
  | { type: "ChildUpdated"; familyId: string; childId: string; changes: Record<string, any> }

  // Savings events
  | { type: "SavingsDeposited"; familyId: string; childId: string; amount: number; timestamp: number; note: string }
  | { type: "SavingsWithdrawn"; familyId: string; childId: string; amount: number; timestamp: number; note: string }
  | { type: "SavingsStreakExtended"; familyId: string; childId: string; streakDays: number }
  | { type: "SavingsStreakBroken"; familyId: string; childId: string; previousStreak: number }
  | { type: "SavingsMilestone"; familyId: string; childId: string; milestone: number; totalSaved: number }

  // Spending events
  | { type: "SpendingLogged"; familyId: string; ownerId: string; ownerKind: string; amount: number; category: string; timestamp: number }
  | { type: "SpendingBudgetExceeded"; familyId: string; ownerId: string; category: string; spent: number; budget: number }

  // Goal events
  | { type: "GoalCreated"; familyId: string; goalId: string; ownerId: string; title: string; targetAmount: number; type: string; cadence: string; visibility: string }
  | { type: "GoalUpdated"; familyId: string; goalId: string; changes: Record<string, any> }
  | { type: "GoalContributed"; familyId: string; goalId: string; contributorId: string; amount: number; newTotal: number; targetAmount: number }
  | { type: "GoalCompleted"; familyId: string; goalId: string; ownerId: string; title: string; finalAmount: number }
  | { type: "GoalArchived"; familyId: string; goalId: string; ownerId: string }
  | { type: "GoalPeriodReset"; familyId: string; goalId: string; cadence: string; newPeriodStart: number }

  // Investment events
  | { type: "InvestmentAdded"; familyId: string; childId: string; investmentId: string; name: string; type: string; amount: number }
  | { type: "InvestmentUpdated"; familyId: string; investmentId: string; newValue: number; oldValue: number }
  | { type: "InvestmentClosed"; familyId: string; investmentId: string; finalValue: number }

  // Token events
  | { type: "TokenAwarded"; familyId: string; childId: string; tokens: number; awardedBy: string; note: string }
  | { type: "TokenRedeemed"; familyId: string; childId: string; tokens: number; cashValue: number }

  // Education events
  | { type: "LessonStarted"; userId: string; lessonId: string; lessonTitle: string }
  | { type: "LessonCompleted"; userId: string; lessonId: string; lessonTitle: string; score: number; timeSpentSec: number }
  | { type: "QuizPassed"; userId: string; lessonId: string; score: number }
  | { type: "QuizFailed"; userId: string; lessonId: string; score: number }

  // Achievement events
  | { type: "BadgeEarned"; userId: string; achievementCode: string; achievementTitle: string; tier: string; points: number }
  | { type: "StreakMilestone"; userId: string; childId: string; streakDays: number; milestone: number };

// ---- Event Bus (simple pub/sub) -------------------------------------------

type EventHandler = (event: DomainEvent) => void | Promise<void>;
const handlers: EventHandler[] = [];

export function subscribe(handler: EventHandler): () => void {
  handlers.push(handler);
  return () => {
    const idx = handlers.indexOf(handler);
    if (idx >= 0) handlers.splice(idx, 1);
  };
}

export async function publish(event: DomainEvent): Promise<void> {
  await Promise.all(handlers.map((h) => Promise.resolve(h(event)).catch(() => {})));
}
