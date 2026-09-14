import type { UserStatus } from "./user";

export interface Department {
  id: string;
  name: string;
  /** Short code, e.g. "PROD". */
  code: string;
  description: string;
  /** How many users sit in this department. */
  members: number;
  status: UserStatus;
}
