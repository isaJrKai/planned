// ============================================================================
// ROLES — Role definitions for RBAC
// ============================================================================

export const ROLES = {
  ADMIN: "ADMIN",
  PARENT: "PARENT",
  CHILD: "CHILD",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  PARENT: "Parent",
  CHILD: "Child",
};
