"use client";

import { RefreshCw } from "lucide-react";
import {
  daysWaitingOptions,
  optionsFrom,
  ScreenState,
} from "@/components/common/screen-state";
import { DraftsTable } from "@/components/lawyers/drafts-table";
import { fetchDrafts } from "@/lib/lawyers";
import { useApiData } from "@/lib/use-api-data";

/** Registrations the lawyer started but never submitted. */
export function DraftsView() {
  const { data, loading, error, retry } = useApiData(fetchDrafts);
  const rows = data?.data ?? [];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <RefreshCw className="size-4" aria-hidden />
          Refresh
        </button>
      </div>

      <ScreenState
        loading={loading}
        error={error}
        onRetry={retry}
        loadingLabel="Loading drafts…"
      >
        <DraftsTable
          drafts={rows}
          typeOptions={optionsFrom(
            rows.map((row) => row.practiceType),
            "All types",
          )}
          periodOptions={daysWaitingOptions}
        />
      </ScreenState>
    </>
  );
}
