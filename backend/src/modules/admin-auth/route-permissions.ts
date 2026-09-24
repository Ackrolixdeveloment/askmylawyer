import { levelFor, normalisePermissions } from '../admin-users/permission-catalogue';
import type { AccessLevel } from '../admin-users/permission-catalogue';

/**
 * Which permission key each admin route belongs to.
 *
 * Longest match wins, so a route lands on the screen it belongs to
 * ("/admin/lawyers/verified" → lawyers.verified) and anything shared falls
 * back to the module ("/admin/lawyers/:id/application" → lawyers). Checked
 * on every request, so an admin cannot reach a screen by typing its URL or
 * calling the API directly.
 */
const ROUTE_KEYS: { prefix: string; key: string; methods?: string[] }[] = [
  // Lawyer Management
  { prefix: 'lawyers/verified', key: 'lawyers.verified' },
  { prefix: 'lawyers/onboarding', key: 'lawyers.onboarding' },
  { prefix: 'lawyers/corrections', key: 'lawyers.onboarding' },
  { prefix: 'lawyers/drafts', key: 'lawyers.onboarding' },
  { prefix: 'lawyers/deleted', key: 'lawyers.deleted' },
  { prefix: 'lawyers', key: 'lawyers' },
  { prefix: 'edit-requests', key: 'lawyers.edit-approvals' },

  // User Management
  { prefix: 'departments', key: 'users.departments' },
  { prefix: 'categories', key: 'users.categories' },
  { prefix: 'roles', key: 'users.roles' },
  { prefix: 'users', key: 'users.users' },

  // Push Notifications. The composer looks up who it would reach, so those
  // two belong to the Send screen rather than to History.
  { prefix: 'notifications/scheduled', key: 'notifications.scheduled' },
  { prefix: 'notifications/audience', key: 'notifications.send' },
  { prefix: 'notifications/recipients', key: 'notifications.send' },
  { prefix: 'notifications', key: 'notifications.send', methods: ['POST'] },
  { prefix: 'notifications', key: 'notifications.history' },

  // Still to be built, but guarded from the start.
  { prefix: 'customers', key: 'customers' },
  { prefix: 'consultations', key: 'consultations' },
  { prefix: 'billing', key: 'billing' },
  { prefix: 'referral', key: 'referral' },
  { prefix: 'support', key: 'support' },
];

/** Reading needs "read"; anything that changes data needs "full". */
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface RouteRequirement {
  key: string;
  level: Exclude<AccessLevel, 'none'>;
}

/**
 * What the given admin request needs. Null means the route is open to any
 * signed-in admin — signing in and out, and their own bell.
 */
export function requirementFor(method: string, path: string): RouteRequirement | null {
  // "/api/v1/admin/lawyers/verified?x=1" → "lawyers/verified"
  const match = /\/admin\/([^?]*)/.exec(path);
  if (!match) return null;

  const route = match[1].replace(/\/+$/, '');
  const [section] = route.split('/');
  if (!section || section === 'auth' || section === 'alerts') return null;

  // Longest prefix first, so the screen beats the module it sits in.
  const candidates = ROUTE_KEYS.filter(
    (entry) =>
      (route === entry.prefix || route.startsWith(`${entry.prefix}/`)) &&
      (!entry.methods || entry.methods.includes(method)),
  ).sort((a, b) => b.prefix.length - a.prefix.length);

  const found = candidates[0];
  if (!found) return null;

  return { key: found.key, level: WRITE_METHODS.has(method) ? 'full' : 'read' };
}

/** Does this permission set satisfy the requirement? */
export function satisfies(permissions: unknown, requirement: RouteRequirement) {
  const level = levelFor(normalisePermissions(permissions), requirement.key);
  if (level === 'none') return false;
  return requirement.level === 'read' ? true : level === 'full';
}
