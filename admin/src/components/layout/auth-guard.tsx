"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui";
import { NotificationToasts } from "./notification-toasts";
import { watchAdminEvents } from "@/lib/alerts";
import { canSee, getCurrentAdmin, type AdminSession } from "@/lib/auth";
import { keyForPath } from "@/lib/modules";
import { enableWebPush } from "@/lib/web-push";

/**
 * A change is pushed over the live stream, so this is only a safety net for
 * a stream that died quietly — not how the panel normally finds out.
 */
const REFRESH_EVERY = 300_000;

const AdminContext = createContext<AdminSession | null>(null);

/** Shown in place of a screen the signed-in admin may not open. */
function NoAccess() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <Card className="max-w-md p-8 text-center">
        <h1 className="text-lg font-semibold text-ink">No access</h1>
        <p className="mt-2 text-sm text-ink-muted">
          You do not have permission to open this part of the panel. Ask an
          administrator if you think you should.
        </p>
      </Card>
    </main>
  );
}

/** The signed-in admin. Only usable inside the admin layout. */
export function useAdmin() {
  const admin = useContext(AdminContext);
  if (!admin) throw new Error("useAdmin must be used inside <AuthGuard>.");
  return admin;
}

/**
 * Loads the session from the backend before showing any admin screen, and
 * sends the visitor to /login when there is none.
 *
 * It keeps asking: permissions are changed by someone else, so an open panel
 * re-checks on a timer, when the tab is focused again and on every
 * navigation. The menu and the screens then follow within seconds, with no
 * refresh or sign-in needed. The API enforces the same rules on every
 * request regardless.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminSession | null>(null);

  /** What the last check saw, to spot a change without re-rendering. */
  const lastSeen = useRef<string>("");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (cancelled || document.visibilityState === "hidden") return;

      try {
        const current = await getCurrentAdmin();
        if (cancelled) return;

        const fingerprint = JSON.stringify({
          permissions: current.permissions,
          isSuperAdmin: current.isSuperAdmin,
          status: current.status,
        });
        if (fingerprint === lastSeen.current) return;

        // The notification itself tells them what changed; this only keeps
        // the menu and the screens honest.
        lastSeen.current = fingerprint;
        setAdmin(current);
      } catch {
        if (!cancelled) router.replace("/login");
      }
    }

    void check();

    // Desktop notifications for when this panel is closed or in another tab.
    void enableWebPush();

    // The backend says when access changed; no polling needed for it.
    const stopWatching = watchAdminEvents((type) => {
      if (type === "permissions") void check();
    });

    const timer = setInterval(() => void check(), REFRESH_EVERY);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      stopWatching();
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
    // Re-runs on navigation, so opening a screen always checks first.
  }, [router, pathname]);

  if (!admin) return null;

  // Typing the URL of a module they were not granted gets them this rather
  // than the screen. The API refuses the calls behind it either way.
  const required = keyForPath(pathname);
  const body =
    required && !canSee(admin, required) ? <NoAccess /> : children;

  return (
    <AdminContext value={admin}>
      <NotificationToasts />
      {body}
    </AdminContext>
  );
}
