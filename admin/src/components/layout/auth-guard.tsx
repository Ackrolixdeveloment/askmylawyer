"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentAdmin, type AdminSession } from "@/lib/auth";

const AdminContext = createContext<AdminSession | null>(null);

/** The signed-in admin. Only usable inside the admin layout. */
export function useAdmin() {
  const admin = useContext(AdminContext);
  if (!admin) throw new Error("useAdmin must be used inside <AuthGuard>.");
  return admin;
}

/**
 * Loads the session from the backend before showing any admin screen, and
 * sends the visitor to /login when there is none. The API enforces access on
 * every request; this only keeps the UI from rendering for signed-out users.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminSession | null>(null);

  useEffect(() => {
    let cancelled = false;

    getCurrentAdmin()
      .then((current) => {
        if (!cancelled) setAdmin(current);
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!admin) return null;

  return <AdminContext value={admin}>{children}</AdminContext>;
}
