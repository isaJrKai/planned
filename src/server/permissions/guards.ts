// ============================================================================
// GUARDS — Server-side authorization checks
// ============================================================================
// Every route handler + server action calls these before executing logic.
// Throws AuthorizationError if checks fail.

import { PERMISSIONS, ROLE_PERMISSIONS, type Permission } from "./permissions";
import type { Role } from "./roles";
import { AuthorizationError, AuthenticationError } from "@/lib/errors";
import { db } from "@/lib/db";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  familyId?: string;
  childId?: string;
}

// Mock session for MVP — in production this calls auth() from NextAuth.
// For now, returns a default parent user so the app works.
export async function getCurrentUser(): Promise<AuthUser | null> {
  // TODO: Replace with real NextAuth session
  // const session = await auth();
  // if (!session?.user) return null;
  // return session.user as AuthUser;

  // MVP fallback: return a default parent user
  const user = await db.user.findFirst({
    where: { role: "PARENT", deletedAt: null },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    familyId: user.familyId ?? undefined,
    childId: user.childId ?? undefined,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthenticationError();
  }
  return user;
}

export async function requirePermission(permission: Permission): Promise<AuthUser> {
  const user = await requireAuth();
  const allowed = ROLE_PERMISSIONS[user.role as Role];
  if (!allowed.includes(permission)) {
    throw new AuthorizationError(`Missing permission: ${permission}`);
  }
  return user;
}

export async function requireFamilyAccess(familyId: string): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role === "ADMIN") return user;
  if (user.familyId !== familyId) {
    throw new AuthorizationError("Cross-family access denied");
  }
  return user;
}

export async function requireChildAccess(childId: string): Promise<AuthUser> {
  const user = await requireAuth();

  if (user.role === "ADMIN") return user;

  if (user.role === "PARENT") {
    const child = await db.child.findUnique({
      where: { id: childId },
      select: { familyId: true },
    });
    if (!child || child.familyId !== user.familyId) {
      throw new AuthorizationError("Child not found in your family");
    }
    return user;
  }

  if (user.role === "CHILD") {
    if (user.childId !== childId) {
      throw new AuthorizationError("Cannot access another child's data");
    }
    return user;
  }

  throw new AuthorizationError("Invalid role");
}

// Filter goals by visibility — children only see revealed + own private goals.
export function filterGoalsByViewer<
  T extends { ownerId: string; visibility: string },
>(
  goals: T[],
  viewerId: string,
  viewerRole: Role,
): T[] {
  if (viewerRole === "ADMIN" || viewerRole === "PARENT") return goals;
  return goals.filter(
    (g) => g.visibility === "revealed" || g.ownerId === viewerId,
  );
}
