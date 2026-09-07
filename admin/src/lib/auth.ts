/**
 * MOCK AUTH — no backend yet.
 *
 * Credentials are hard-coded and the session is a localStorage flag, so this
 * is a UI shell only and provides no real security. Swap every function here
 * for real API calls (and an httpOnly cookie session) before launch.
 */

export const MOCK_CREDENTIALS = {
  email: "admin@askmylawyer.com",
  password: "Admin@123",
};

/** Any email is accepted at the forgot-password step; this code always works. */
export const MOCK_OTP = "123456";

const SESSION_KEY = "aml.admin.session";

export function signIn(email: string, password: string) {
  const ok =
    email.trim().toLowerCase() === MOCK_CREDENTIALS.email &&
    password === MOCK_CREDENTIALS.password;

  if (ok) {
    try {
      localStorage.setItem(SESSION_KEY, email.trim().toLowerCase());
    } catch {
      // Private mode or blocked storage — the redirect still works.
    }
  }
  return ok;
}

export function signOut() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clean up.
  }
}

export function isAuthenticated() {
  try {
    return Boolean(localStorage.getItem(SESSION_KEY));
  } catch {
    return false;
  }
}