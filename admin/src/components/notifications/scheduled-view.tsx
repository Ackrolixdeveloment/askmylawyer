"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ScreenState } from "@/components/common/screen-state";
import { useAdmin } from "@/components/layout/auth-guard";
import { ScheduledTable } from "@/components/notifications/scheduled-table";
import { ApiError } from "@/lib/api";
import { canChange } from "@/lib/auth";
import { cancelScheduled, fetchScheduled } from "@/lib/notifications";
import { useApiData } from "@/lib/use-api-data";
import type { ScheduledBroadcast } from "@/types/notification";

/**
 * Notifications queued to go out later. A worker on the backend sends each
 * one when its time comes; until then it can be edited or called off.
 */
export function ScheduledView() {
  const { data, loading, error, retry } = useApiData(() => fetchScheduled());
  const canSchedule = canChange(useAdmin(), "notifications.scheduled");
  const [failure, setFailure] = useState<string | null>(null);

  async function cancel(row: ScheduledBroadcast) {
    setFailure(null);

    try {
      await cancelScheduled(row.id);
      retry();
    } catch (cause) {
      setFailure(
        cause instanceof ApiError ? cause.message : "Could not cancel this broadcast.",
      );
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl leading-8 font-bold text-ink">Scheduled</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Queued notifications, sent automatically at the time you set
          </p>
        </div>

        {canSchedule ? (
          <Link
            href="/notifications/send"
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-ink/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Plus className="size-[18px]" aria-hidden />
            New Broadcast
          </Link>
        ) : null}
      </div>

      {failure ? <p className="mt-3 text-sm text-negative">{failure}</p> : null}

      <div className="mt-6">
        <ScreenState
          loading={loading}
          error={error}
          onRetry={retry}
          loadingLabel="Loading scheduled notifications…"
        >
          <ScheduledTable broadcasts={data?.data ?? []} onCancel={cancel} />
        </ScreenState>
      </div>
    </>
  );
}
