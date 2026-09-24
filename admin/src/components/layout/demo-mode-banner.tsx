"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchEngineStatus } from "@/lib/engine-settings";
import type { EngineStatus } from "@/types/engine";

/**
 * A strip across the top whenever the consultation engine is in demo mode.
 *
 * Demo settings quietly left on in production would broadcast every
 * consultation to every lawyer and skip payment, so this is deliberately
 * hard to miss and visible to every admin, whatever their permissions.
 */
export function DemoModeBanner() {
  const [status, setStatus] = useState<EngineStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchEngineStatus()
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch(() => {
        // Signed out, or the backend is down; the guard handles both.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!status?.demoMode) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 bg-warn px-4 py-2 text-center text-sm font-medium text-white">
      <TriangleAlert className="size-4 shrink-0" aria-hidden />
      <span>
        Demo mode: every consultation is offered to every lawyer
        {status.skipPayment ? ", and payment is skipped" : ""}.
      </span>
      <Link href="/settings/engine" className="underline underline-offset-2">
        Change
      </Link>
    </div>
  );
}
