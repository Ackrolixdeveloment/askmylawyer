"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { isAuthenticated } from "@/lib/auth";

/** localStorage is client-only, so the server snapshot is always "unknown". */
const subscribe = () => () => {};

/**
 * MOCK GUARD — client-side only, and trivially bypassed.
 *
 * It keeps the demo honest (signing out actually locks you out of the admin
 * screens) but real protection has to happen on the server once the API and
 * a session cookie exist.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authed = useSyncExternalStore(
    subscribe,
    () => isAuthenticated(),
    () => null,
  );

  useEffect(() => {
    if (authed === false) router.replace("/login");
  }, [authed, router]);

  // `null` is the server render / first paint, before storage can be read.
  if (!authed) return null;

  return <>{children}</>;
}