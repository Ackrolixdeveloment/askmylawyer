/**
 * What can be granted, and to what degree.
 *
 * The modules and their screens mirror the admin panel's own menu, so the
 * matrix reads like the sidebar. The panel renders it straight from here and
 * hides what a person may not open; the backend checks the same keys on
 * every request.
 *
 * "read" lets someone look; "full" lets them act (approve, edit, delete,
 * send). The module row is a quick way to set every screen at once — what
 * counts is each screen's own level, and a module is as open as the most
 * open screen inside it.
 */
export const ACCESS_LEVELS = ['none', 'read', 'full'] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export interface PermissionModule {
  id: string;
  label: string;
  /** The screens inside it, named as the menu names them. */
  actions: { id: string; label: string }[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  { id: 'dashboard', label: 'Dashboard', actions: [] },
  {
    id: 'lawyers',
    label: 'Lawyer Management',
    actions: [
      { id: 'lawyers.verified', label: 'Verified Lawyers' },
      { id: 'lawyers.onboarding', label: 'Onboarding Requests' },
      { id: 'lawyers.edit-approvals', label: 'Edit Approvals' },
      { id: 'lawyers.deleted', label: 'Deleted Lawyers' },
    ],
  },
  { id: 'customers', label: 'Customer Management', actions: [] },
  {
    id: 'users',
    label: 'User Management',
    actions: [
      { id: 'users.departments', label: 'Departments' },
      { id: 'users.categories', label: 'Category' },
      { id: 'users.roles', label: 'Role' },
      { id: 'users.users', label: 'Users & Permissions' },
    ],
  },
  {
    id: 'consultations',
    label: 'Consultation Management',
    actions: [
      { id: 'consultations.completed', label: 'Completed' },
      { id: 'consultations.refunded', label: 'Refunded' },
      { id: 'consultations.disputed', label: 'Disputed' },
      { id: 'consultations.cancelled', label: 'Cancelled' },
      { id: 'consultations.in-progress', label: 'In Progress' },
    ],
  },
  { id: 'billing', label: 'Billing Management', actions: [] },
  { id: 'referral', label: 'Referral', actions: [] },
  {
    id: 'notifications',
    label: 'Push Notifications',
    actions: [
      { id: 'notifications.send', label: 'Send Notification' },
      { id: 'notifications.history', label: 'History' },
      { id: 'notifications.templates', label: 'Templates' },
      { id: 'notifications.scheduled', label: 'Scheduled' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    actions: [
      { id: 'settings.app', label: 'App Setting' },
      { id: 'settings.integrations', label: 'Integrations' },
      { id: 'settings.engine', label: 'Consultation Engine' },
    ],
  },
  {
    id: 'support',
    label: 'Support & Help Desk',
    actions: [
      { id: 'support.new', label: 'New Tickets' },
      { id: 'support.in-progress', label: 'In Progress' },
      { id: 'support.resolved', label: 'Resolved' },
    ],
  },
];

/** Every key the matrix may contain — modules and their screens. */
export const PERMISSION_KEYS = new Set(
  PERMISSION_MODULES.flatMap((module) => [
    module.id,
    ...module.actions.map((action) => action.id),
  ]),
);

export type PermissionSet = Record<string, AccessLevel>;

/** Nothing granted. What a brand new admin user starts with. */
export function emptyPermissions(): PermissionSet {
  return Object.fromEntries([...PERMISSION_KEYS].map((key) => [key, 'none']));
}

/** Fills in anything the stored set is missing, and drops keys we retired. */
export function normalisePermissions(stored: unknown): PermissionSet {
  const saved = (stored ?? {}) as Record<string, unknown>;
  const result = emptyPermissions();

  for (const key of PERMISSION_KEYS) {
    const value = saved[key];
    if (typeof value === 'string' && ACCESS_LEVELS.includes(value as AccessLevel)) {
      result[key] = value as AccessLevel;
    }
  }

  return result;
}

const RANK: Record<AccessLevel, number> = { none: 0, read: 1, full: 2 };

/**
 * What someone may do with a given key.
 *
 * A screen speaks for itself. A module counts as open as its most open
 * screen, so granting Templates alone also opens the shared endpoints that
 * sit behind Push Notifications — without having to remember to set the
 * parent row as well.
 */
export function levelFor(permissions: PermissionSet, key: string): AccessLevel {
  const own = permissions[key] ?? 'none';
  if (key.includes('.')) return own;

  let best = own;
  for (const [candidate, level] of Object.entries(permissions)) {
    if (candidate.startsWith(`${key}.`) && RANK[level] > RANK[best]) best = level;
  }

  return best;
}
