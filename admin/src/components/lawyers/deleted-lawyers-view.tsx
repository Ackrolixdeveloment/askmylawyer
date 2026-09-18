"use client";

import { ScreenState } from "@/components/common/screen-state";
import { DeletedLawyersTable } from "@/components/lawyers/deleted-lawyers-table";
import { fetchDeletedLawyers } from "@/lib/lawyers";
import { useApiData } from "@/lib/use-api-data";

/** Removed accounts, kept for the audit trail. */
export function DeletedLawyersView() {
  const { data, loading, error, retry } = useApiData(fetchDeletedLawyers);

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading deleted lawyers…"
    >
      <DeletedLawyersTable rows={data?.data ?? []} />
    </ScreenState>
  );
}
