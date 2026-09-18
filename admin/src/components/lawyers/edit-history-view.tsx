"use client";

import { ScreenState } from "@/components/common/screen-state";
import { EditHistoryTable } from "@/components/lawyers/edit-history-table";
import { fetchEditHistory } from "@/lib/edit-requests";
import { useApiData } from "@/lib/use-api-data";

/** Every lawyer who has asked for a profile change, with how it went. */
export function EditHistoryView() {
  const { data, loading, error, retry } = useApiData(fetchEditHistory);

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading lawyer history…"
    >
      <EditHistoryTable rows={data?.data ?? []} />
    </ScreenState>
  );
}
