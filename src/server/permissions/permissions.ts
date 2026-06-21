// ============================================================================
// PERMISSIONS — Permission matrix mapping roles to allowed actions
// ============================================================================

import type { Role } from "./roles";

export const PERMISSIONS = {
  // Family
  FAMILY_VIEW: "family:view",
  FAMILY_MANAGE: "family:manage",

  // Children
  CHILD_VIEW: "child:view",
  CHILD_CREATE: "child:create",
  CHILD_UPDATE: "child:update",
  CHILD_DELETE: "child:delete",

  // Transactions
  TRANSACTION_VIEW: "transaction:view",
  TRANSACTION_CREATE: "transaction:create",
  TRANSACTION_DELETE: "transaction:delete",

  // Goals
  GOAL_VIEW: "goal:view",
  GOAL_CREATE: "goal:create",
  GOAL_UPDATE: "goal:update",
  GOAL_DELETE: "goal:delete",
  GOAL_CONTRIBUTE: "goal:contribute",

  // Investments
  INVESTMENT_VIEW: "investment:view",
  INVESTMENT_MANAGE: "investment:manage",

  // Tokens
  TOKEN_AWARD: "token:award",
  TOKEN_REDEEM: "token:redeem",
  TOKEN_VIEW_LEDGER: "token:view:ledger",

  // Spending
  SPENDING_VIEW: "spending:view",
  SPENDING_LOG: "spending:log",

  // Reports
  REPORT_VIEW: "report:view",
  REPORT_GENERATE: "report:generate",

  // Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",

  // Uploads
  UPLOAD_AVATAR: "upload:avatar",

  // Education
  EDUCATION_VIEW: "education:view",
  EDUCATION_COMPLETE_LESSON: "education:complete:lesson",

  // Achievements
  ACHIEVEMENT_VIEW: "achievement:view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS),

  PARENT: [
    PERMISSIONS.FAMILY_VIEW,
    PERMISSIONS.FAMILY_MANAGE,
    PERMISSIONS.CHILD_VIEW,
    PERMISSIONS.CHILD_CREATE,
    PERMISSIONS.CHILD_UPDATE,
    PERMISSIONS.CHILD_DELETE,
    PERMISSIONS.TRANSACTION_VIEW,
    PERMISSIONS.TRANSACTION_CREATE,
    PERMISSIONS.TRANSACTION_DELETE,
    PERMISSIONS.GOAL_VIEW,
    PERMISSIONS.GOAL_CREATE,
    PERMISSIONS.GOAL_UPDATE,
    PERMISSIONS.GOAL_DELETE,
    PERMISSIONS.GOAL_CONTRIBUTE,
    PERMISSIONS.INVESTMENT_VIEW,
    PERMISSIONS.INVESTMENT_MANAGE,
    PERMISSIONS.TOKEN_AWARD,
    PERMISSIONS.TOKEN_VIEW_LEDGER,
    PERMISSIONS.SPENDING_VIEW,
    PERMISSIONS.SPENDING_LOG,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.UPLOAD_AVATAR,
    PERMISSIONS.ACHIEVEMENT_VIEW,
    PERMISSIONS.EDUCATION_VIEW,
  ],

  CHILD: [
    PERMISSIONS.CHILD_VIEW,
    PERMISSIONS.TRANSACTION_VIEW,
    PERMISSIONS.TRANSACTION_CREATE,
    PERMISSIONS.GOAL_VIEW,
    PERMISSIONS.GOAL_CONTRIBUTE,
    PERMISSIONS.INVESTMENT_VIEW,
    PERMISSIONS.TOKEN_REDEEM,
    PERMISSIONS.SPENDING_VIEW,
    PERMISSIONS.SPENDING_LOG,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.UPLOAD_AVATAR,
    PERMISSIONS.ACHIEVEMENT_VIEW,
    PERMISSIONS.EDUCATION_VIEW,
    PERMISSIONS.EDUCATION_COMPLETE_LESSON,
  ],
};
