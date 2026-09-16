import { api } from "./api";

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
}

export async function signIn(email: string, password: string) {
  const { admin } = await api<{ admin: AdminSession }>("/admin/auth/login", {
    method: "POST",
    body: { email: email.trim(), password },
  });
  return admin;
}

export async function signOut() {
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
