export type UserStatus = "active" | "inactive";

export interface AdminUser {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
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
