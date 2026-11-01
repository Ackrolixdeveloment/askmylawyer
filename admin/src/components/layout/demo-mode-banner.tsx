"use client";
import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchEngineStatus } from "@/lib/engine-settings";
import type { EngineStatus } from "@/types/engine";
export function DemoModeBanner() {
  const [status, setStatus] = useState<EngineStatus | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchEngineStatus()
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  if (!status?.demoMode) return null;
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-[11px] text-amber-900 sm:px-6 lg:px-8">
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
      <strong>Demo mode{status.skipPayment ? " · Payment skipped" : ""}</strong>
      <span className="hidden sm:inline">
        Every approved lawyer may receive offers, regardless of availability.
      </span>
      <Link
        href="/settings/engine"
        className="ml-auto shrink-0 font-semibold underline underline-offset-2"
      >
        Review settings
      </Link>
    </div>
  );
}
