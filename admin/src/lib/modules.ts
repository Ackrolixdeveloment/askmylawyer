/**
 * Which permission key each admin screen belongs to.
 *
 * The sidebar hides what an admin cannot open and the layout refuses the URL
 * if they type it anyway. The API checks the same keys on every request, so
 * this is the polite half rather than the guard.
 *
 * Longest path wins, so a screen matches its own key and anything else falls
 * back to the module it sits in.
 */
const SCREEN_KEYS: { prefix: string; key: string }[] = [
  { prefix: "/dashboard", key: "dashboard" },

  { prefix: "/lawyers/verified", key: "lawyers.verified" },
  { prefix: "/lawyers/onboarding", key: "lawyers.onboarding" },
  { prefix: "/lawyers/edit-approvals", key: "lawyers.edit-approvals" },
  { prefix: "/lawyers/deleted", key: "lawyers.deleted" },
  { prefix: "/lawyers", key: "lawyers" },

  { prefix: "/customers", key: "customers" },

  { prefix: "/users/departments", key: "users.departments" },
  { prefix: "/users/category", key: "users.categories" },
  { prefix: "/users/roles", key: "users.roles" },
  { prefix: "/users", key: "users.users" },

  { prefix: "/consultations/completed", key: "consultations.completed" },
  { prefix: "/consultations/refunded", key: "consultations.refunded" },
  { prefix: "/consultations/disputed", key: "consultations.disputed" },
  { prefix: "/consultations/cancelled", key: "consultations.cancelled" },
  { prefix: "/consultations/in-progress", key: "consultations.in-progress" },
  { prefix: "/consultations", key: "consultations" },

  { prefix: "/billing", key: "billing" },
  { prefix: "/referral", key: "referral" },

  { prefix: "/notifications/send", key: "notifications.send" },
  { prefix: "/notifications/history", key: "notifications.history" },
  { prefix: "/notifications/templates", key: "notifications.templates" },
  { prefix: "/notifications/scheduled", key: "notifications.scheduled" },
  { prefix: "/notifications", key: "notifications" },

  { prefix: "/settings/app", key: "settings.app" },
  { prefix: "/settings/engine", key: "settings.engine" },
  { prefix: "/settings/integrations", key: "settings.integrations" },
  { prefix: "/settings", key: "settings" },

  { prefix: "/support/new", key: "support.new" },
  { prefix: "/support/in-progress", key: "support.in-progress" },
  { prefix: "/support/resolved", key: "support.resolved" },
  { prefix: "/support", key: "support" },
];

/** Where each module's own screen lives, for the landing redirect. */
const MODULE_HOME: Record<string, string> = {
  dashboard: "/dashboard",
  lawyers: "/lawyers/verified",
  customers: "/customers",
  consultations: "/consultations/in-progress",
  billing: "/billing",
  notifications: "/notifications/send",
  support: "/support/new",
  users: "/users",
  settings: "/settings/app",
};

/**
 * Where to land after signing in: the dashboard when they have it, otherwise
 * the first module they were granted. Their own notifications are open to
 * everyone, so that is the last resort.
 */
export function landingPath(canOpen: (key: string) => boolean) {
  const first = Object.entries(MODULE_HOME).find(
    ([moduleId, path]) => canOpen(moduleId) && canOpen(keyForPath(path) ?? moduleId),
  );
  return first ? first[1] : "/notifications/alerts";
}

/** Null for screens open to any signed-in admin. */
export function keyForPath(pathname: string): string | null {
  // Everyone has a bell, whatever else they were granted.
  if (pathname.startsWith("/notifications/alerts")) return null;

  const match = SCREEN_KEYS.filter(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`),
  ).sort((a, b) => b.prefix.length - a.prefix.length)[0];

  return match?.key ?? null;
}

/** Kept for callers that still think in modules. */
export const moduleForPath = keyForPath;
