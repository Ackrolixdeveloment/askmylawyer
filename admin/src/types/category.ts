import type { UserStatus } from "./user";

export interface Category {
  id: string;
  name: string;
  /** Department this category belongs to. */
  department: string;
  status: UserStatus;
}

export interface AdminRole {
  id: string;
  name: string;
  department: string;
  description: string;
  /** How many permissions this role grants. */
  permissions: number;
  status: UserStatus;
}
