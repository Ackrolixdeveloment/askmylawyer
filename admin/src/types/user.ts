export type UserStatus = "active" | "inactive";

export interface AdminUser {
  id: string;
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

export interface Role {
  id: string;
  name: string;
  /** Null for top-level roles. */
  parentId: string | null;
  /** Built-in roles cannot be deleted. */
  system?: boolean;
}
