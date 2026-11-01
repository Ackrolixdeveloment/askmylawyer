"use client";

import { ScreenState } from "@/components/common/screen-state";
import { DraftsTable } from "@/components/lawyers/drafts-table";
import { fetchDrafts } from "@/lib/lawyers";
import { useApiData } from "@/lib/use-api-data";

/** Registrations the lawyer started but never submitted. */
export function DraftsView() {
  const { data, loading, error, retry } = useApiData(fetchDrafts);
  const rows = data?.data ?? [];

  return (
    <>
      <ScreenState
        loading={loading}
        error={error}
        onRetry={retry}
        loadingLabel="Loading drafts…"
      >
        <DraftsTable drafts={rows} onChanged={retry} />
      </ScreenState>
    </>
  );
}
