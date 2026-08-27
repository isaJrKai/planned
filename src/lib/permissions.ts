// ============================================================================
// PERMISSIONS — Platform + Family role checks
// ============================================================================
// Dual-role system:
//   platformRole: FOUNDER | USER  (platform infrastructure access)
//   familyRole:   FAMILY_MANAGER | PARENT | CHILD  (in-family permissions)
//
// The Founder is NOT a customer-facing role. Customers never know it exists.
// The Founder is simply a user with elevated platform permissions who also
// has a family account and uses Planned like any parent.
// ============================================================================

export const FOUNDER_ROLE = "FOUNDER";
export const USER_ROLE = "USER";

export const FAMILY_MANAGER_ROLE = "FAMILY_MANAGER";
export const PARENT_ROLE = "PARENT";
export const CHILD_ROLE = "CHILD";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  platformRole: string;
  familyRole: string;
  twoFactorEnabled: boolean;
}

// ---- Platform role checks ----

export const isFounder = (user: SessionUser | null): boolean => {
  return user?.platformRole === FOUNDER_ROLE;
};

export const requireFounder = (user: SessionUser | null): void => {
  if (!user || user.platformRole !== FOUNDER_ROLE) {
    throw new ForbiddenError("Access denied.");
  }
};

export const canAccessPlatformConsole = (user: SessionUser | null): boolean => {
  return user?.platformRole === FOUNDER_ROLE;
};

// ---- Family role checks ----

export const isFamilyManager = (user: SessionUser | null): boolean => {
  return user?.familyRole === FAMILY_MANAGER_ROLE;
};

export const isParent = (user: SessionUser | null): boolean => {
  return user?.familyRole === PARENT_ROLE || user?.familyRole === FAMILY_MANAGER_ROLE;
};

export const isChild = (user: SessionUser | null): boolean => {
  return user?.familyRole === CHILD_ROLE;
};

// ---- Combined checks ----

export const canManageFamily = (user: SessionUser | null): boolean => {
  return isFamilyManager(user) || isFounder(user);
};

export const canViewFamilyFinances = (user: SessionUser | null): boolean => {
  return isParent(user) || isFounder(user);
};

// ---- Error class ----

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}
