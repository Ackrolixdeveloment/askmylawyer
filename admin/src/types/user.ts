export type UserStatus = "active" | "inactive";

export interface AdminUser {
  id: string;
  /** Which role the person holds; the id drives the form's select. */
  roleId: string;
  /** Built-in roles (Super Admin) cannot be deleted. */
  isSystemRole: boolean;
  /** Shown under the name, e.g. "EMP - 0001". */
  employeeCode: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  /** Human phrase — "Today", "Yesterday", "3 days ago". */
  lastActive: string;
  /** ISO date the account was created, e.g. "2026-09-08". */
  createdAt: string;
  /** ISO date of the last profile change. */
  lastUpdated: string;
  status: UserStatus;
}

/** A job title. Module access is set per user, not on the role. */
export interface Role {
  id: string;
  name: string;
  /** Empty when the role is not tied to a department. */
  departmentId: string | null;
  department: string;
  description: string;
  /** How many admin users hold it. */
  users: number;
  status: UserStatus;
  /** Built-in roles (Super Admin) cannot be deleted. */
  isSystem: boolean;
}
