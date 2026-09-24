import { api } from "./api";
import type { AccessLevel, PermissionSet } from "./admin-users";
import { disableWebPush } from "./web-push";

/** The signed-in admin, as returned by the backend. */
export interface AdminSession {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive";
  lastLoginAt: string | null;
  role: { id: string; name: string; isSystem: boolean };
  /** The Super Admin reaches every module. */
  isSuperAdmin: boolean;
  /** Module and action id → the level this person was granted. */
  permissions: PermissionSet;
}

const RANK: Record<AccessLevel, number> = { none: 0, read: 1, full: 2 };

/**
 * What this admin may do with a module or one of its screens.
 *
 * A screen speaks for itself; a module counts as open as its most open
 * screen. So granting Templates alone opens Push Notifications far enough
 * to reach it, with no need to set the parent row too. The backend applies
 * the same rule.
 */
export function levelFor(admin: AdminSession, key: string): AccessLevel {
  if (admin.isSuperAdmin) return "full";

  const permissions = admin.permissions ?? {};
  const own = permissions[key] ?? "none";
  if (key.includes(".")) return own;

  let best = own;
  for (const [candidate, level] of Object.entries(permissions)) {
    if (candidate.startsWith(`${key}.`) && RANK[level] > RANK[best]) best = level;
  }

  return best;
}

export const canSee = (admin: AdminSession, key: string) =>
  levelFor(admin, key) !== "none";

export const canChange = (admin: AdminSession, key: string) =>
  levelFor(admin, key) === "full";

export async function signIn(email: string, password: string) {
  const { admin } = await api<{ admin: AdminSession }>("/admin/auth/login", {
    method: "POST",
    body: { email: email.trim(), password },
  });
  return admin;
}

export async function signOut() {
  // Hand the push token back first: it needs the session that is about to go.
  await disableWebPush();

  try {
    await api("/admin/auth/logout", { method: "POST" });
  } catch {
    // The cookies are gone or the server is down — either way, leave.
  }
}

export async function getCurrentAdmin() {
  const { admin } = await api<{ admin: AdminSession }>("/admin/auth/me");
  return admin;
}

/**
 * MOCK — forgot password has no API yet; this code always works there.
 * Remove once the reset endpoints exist.
 */
export const MOCK_OTP = "123456";
