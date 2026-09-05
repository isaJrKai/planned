import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  bigint,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * Planned — schema
 *
 * Principles:
 *  - Money is stored as integer minor units (bigint). UGX has no minor units,
 *    so UGX 150,000 is stored as 150000. USD $12.50 is stored as 1250.
 *  - Balances are cached on accounts but derived from the ledger. Every
 *    balance change is a transaction row; the reconciliation job compares them.
 *  - Every financial mutation carries an idempotency key unique per family.
 *  - Every important action writes to audit_log.
 */

export const memberRoleEnum = pgEnum("member_role", ["parent", "child"]);
export const accountKindEnum = pgEnum("account_kind", [
  "family_pool",
  "spending",
  "savings",
  "goal",
]);
export const txnKindEnum = pgEnum("txn_kind", [
  "deposit",
  "allowance",
  "transfer",
  "spend",
  "goal_contribution",
  "goal_withdrawal",
  "adjustment",
  "reversal",
]);
export const txnStatusEnum = pgEnum("txn_status", ["posted", "reversed"]);
export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "completed",
  "archived",
]);
export const cadenceEnum = pgEnum("cadence", ["weekly", "monthly"]);
export const requestTypeEnum = pgEnum("request_type", [
  "money_request",
  "goal_withdrawal",
  "purchase",
]);
export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "approved",
  "declined",
  "cancelled",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email"),
    username: text("username"),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("users_email_unique").on(t.email),
    uniqueIndex("users_username_unique").on(t.username),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("sessions_token_hash_unique").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
  ],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const families = pgTable("families", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  currency: text("currency").notNull().default("UGX"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const familyMembers = pgTable(
  "family_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull(),
    birthYear: integer("birth_year"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("family_members_user_family_unique").on(t.userId, t.familyId),
    index("family_members_family_idx").on(t.familyId),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").references(() => familyMembers.id, {
      onDelete: "cascade",
    }),
    kind: accountKindEnum("kind").notNull(),
    name: text("name").notNull(),
    currency: text("currency").notNull(),
    balance: bigint("balance", { mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (t) => [
    index("accounts_family_idx").on(t.familyId),
    index("accounts_member_idx").on(t.memberId),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    kind: txnKindEnum("kind").notNull(),
    status: txnStatusEnum("status").notNull().default("posted"),
    amount: bigint("amount", { mode: "number" }).notNull(),
    currency: text("currency").notNull(),
    fromAccountId: uuid("from_account_id").references(() => accounts.id),
    toAccountId: uuid("to_account_id").references(() => accounts.id),
    memberId: uuid("member_id").references(() => familyMembers.id),
    goalId: uuid("goal_id"),
    category: text("category"),
    description: text("description").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    reversesId: uuid("reverses_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("transactions_idem_unique").on(t.familyId, t.idempotencyKey),
    index("transactions_family_created_idx").on(t.familyId, t.createdAt),
    index("transactions_member_idx").on(t.memberId),
    index("transactions_goal_idx").on(t.goalId),
  ],
);

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").references(() => familyMembers.id, {
      onDelete: "cascade",
    }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    name: text("name").notNull(),
    targetAmount: bigint("target_amount", { mode: "number" }).notNull(),
    targetDate: timestamp("target_date", { withTimezone: true }),
    status: goalStatusEnum("status").notNull().default("active"),
    isShared: boolean("is_shared").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("goals_family_idx").on(t.familyId),
    index("goals_member_idx").on(t.memberId),
  ],
);

export const allowanceRules = pgTable(
  "allowance_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => familyMembers.id, { onDelete: "cascade" }),
    amount: bigint("amount", { mode: "number" }).notNull(),
    cadence: cadenceEnum("cadence").notNull(),
    dayOfPeriod: integer("day_of_period").notNull(), // 0-6 weekday or 1-28 day of month
    savePercent: integer("save_percent").notNull().default(0),
    goalPercent: integer("goal_percent").notNull().default(0),
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
    active: boolean("active").notNull().default(true),
    nextDueAt: timestamp("next_due_at", { withTimezone: true }).notNull(),
    lastPaidPeriod: text("last_paid_period"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("allowance_rules_family_idx").on(t.familyId)],
);

export const familyRules = pgTable("family_rules", {
  familyId: uuid("family_id")
    .primaryKey()
    .references(() => families.id, { onDelete: "cascade" }),
  minSavePercent: integer("min_save_percent").notNull().default(0),
  approvalThreshold: bigint("approval_threshold", { mode: "number" })
    .notNull()
    .default(0),
  dailySpendLimit: bigint("daily_spend_limit", { mode: "number" })
    .notNull()
    .default(0),
  goalWithdrawalNeedsApproval: boolean("goal_withdrawal_needs_approval")
    .notNull()
    .default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const approvalRequests = pgTable(
  "approval_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => familyMembers.id, { onDelete: "cascade" }),
    type: requestTypeEnum("type").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    reason: text("reason").notNull(),
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
    status: requestStatusEnum("status").notNull().default("pending"),
    resolvedBy: uuid("resolved_by").references(() => users.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolutionNote: text("resolution_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("approval_requests_family_status_idx").on(t.familyId, t.status)],
);

export const lessonCompletions = pgTable(
  "lesson_completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => familyMembers.id, { onDelete: "cascade" }),
    lessonSlug: text("lesson_slug").notNull(),
    score: integer("score").notNull(),
    reflection: text("reflection"),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("lesson_completions_unique").on(t.memberId, t.lessonSlug)],
);

export const memberAchievements = pgTable(
  "member_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => familyMembers.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    earnedAt: timestamp("earned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("member_achievements_unique").on(t.memberId, t.key)],
);

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => familyMembers.id, { onDelete: "cascade" }),
    prompt: text("prompt"),
    body: text("body").notNull(),
    visibleToParents: boolean("visible_to_parents").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("journal_member_idx").on(t.memberId)],
);

export const familySettings = pgTable("family_settings", {
  familyId: uuid("family_id")
    .primaryKey()
    .references(() => families.id, { onDelete: "cascade" }),
  aiEnabled: boolean("ai_enabled").notNull().default(true),
  aiBaseUrl: text("ai_base_url"),
  aiModel: text("ai_model"),
  aiApiKeyEncrypted: text("ai_api_key_encrypted"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id"),
    actorUserId: uuid("actor_user_id"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    details: jsonb("details").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("audit_family_created_idx").on(t.familyId, t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type Family = typeof families.$inferSelect;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type AllowanceRule = typeof allowanceRules.$inferSelect;
export type FamilyRules = typeof familyRules.$inferSelect;
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
