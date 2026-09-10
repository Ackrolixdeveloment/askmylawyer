/**
 * Permission matrix for the Manage Permission screen.
 *
 * Each module carries its own access level plus a list of finer-grained
 * actions. Setting the module level cascades to every action beneath it.
 */

export type AccessLevel = "none" | "read" | "full";

export const accessLevels: { value: AccessLevel; label: string }[] = [
  { value: "none", label: "No Access" },
  { value: "read", label: "Read Only" },
  { value: "full", label: "Full Access" },
];

export interface PermissionModule {
  id: string;
  label: string;
  actions: { id: string; label: string }[];
}

export const permissionModules: PermissionModule[] = [
  { id: "dashboard", label: "Dashboard", actions: [] },
  {
    id: "lawyers",
    label: "Lawyer Management",
    actions: [
      { id: "lawyers.view", label: "View Lawyers" },
      { id: "lawyers.approve", label: "Approve Lawyers" },
      { id: "lawyers.reject", label: "Rejected Lawyers" },
      { id: "lawyers.suspend", label: "Suspended Lawyers" },
    ],
  },
  {
    id: "customers",
    label: "Customer Management",
    actions: [
      { id: "customers.view", label: "View Consultations" },
      { id: "customers.bookings", label: "Manage Bookings" },
      { id: "customers.details", label: "View Consultations Details" },
      { id: "customers.cancel", label: "Cancel Consultation" },
    ],
  },
  {
    id: "users",
    label: "User Management",
    actions: [
      { id: "users.view", label: "View Users" },
      { id: "users.add", label: "Add Users" },
      { id: "users.edit", label: "Edit Users" },
      { id: "users.suspend", label: "Suspended Users" },
    ],
  },
  {
    id: "consultations",
    label: "Consultation Management",
    actions: [
      { id: "consultations.view", label: "View Consultations" },
      { id: "consultations.manage", label: "Manage Consultations" },
    ],
  },
  {
    id: "notifications",
    label: "Push Notifications",
    actions: [
      { id: "notifications.send", label: "Send Notifications" },
      { id: "notifications.templates", label: "Manage Templates" },
    ],
  },
  {
    id: "support",
    label: "Support & Help desk",
    actions: [
      { id: "support.respond", label: "Respond to Tickets" },
      { id: "support.view", label: "View Support Tickets" },
    ],
  },
];

/** Every module and action starts with no access. */
export function defaultPermissions(): Record<string, AccessLevel> {
  const entries: [string, AccessLevel][] = [];

  for (const group of permissionModules) {
    entries.push([group.id, "none"]);
    for (const action of group.actions) entries.push([action.id, "none"]);
  }

  return Object.fromEntries(entries);
}
