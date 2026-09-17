/**
 * Thin fetch wrapper for the backend.
 *
 * Calls go to this app's own `/api/v1/*` (forwarded to the backend by
 * next.config.ts), so the httpOnly session cookies are sent automatically.
 * An expired access token is refreshed once and the request retried.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: string[],
  ) {
    super(message);
  }
}

/** Auth calls that must never trigger a refresh-and-retry. */
const NO_REFRESH = new Set([
  "/admin/auth/login",
  "/admin/auth/refresh",
  "/admin/auth/logout",
]);

/** Shared so parallel 401s wait on a single refresh. */
let refreshing: Promise<boolean> | null = null;

function refreshSession() {
  refreshing ??= fetch("/api/v1/admin/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

export async function api<T>(
  path: string,
  { method = "GET", body }: RequestOptions = {},
  retry = true,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Can't reach the server. Check your connection.");
  }

  if (response.status === 401 && retry && !NO_REFRESH.has(path)) {
    if (await refreshSession()) return api<T>(path, { method, body }, false);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (!data) {
      throw new ApiError(
        response.status,
        "SERVER_UNAVAILABLE",
        "The server is not responding. Please try again shortly.",
      );
    }
    throw new ApiError(response.status, data.code, data.message, data.details);
  }

  return data as T;
}
