"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { canSee, getCurrentAdmin } from "@/lib/auth";
import { landingPath } from "@/lib/modules";

/**
 * Wraps the sign-in screens. Someone who still has a session is sent into
 * the panel instead of being shown the login form again.
 */
export function SignedOutOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCurrentAdmin()
      .then((admin) => {
        if (cancelled) return;
        // Straight to wherever they are allowed to work.
        router.replace(landingPath((moduleId) => canSee(admin, moduleId)));
      })
      .catch(() => {
        // No session — the form is what they came for.
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Nothing is drawn while the session is being checked, so the form never
  // flashes up in front of someone who is already signed in.
  if (checking) return null;

  return <>{children}</>;
}
