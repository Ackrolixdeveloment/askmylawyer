"use client";

import { ScreenState } from "@/components/common/screen-state";
import { EditRequestDetail } from "@/components/lawyers/edit-request-detail";
import { fetchEditRequest } from "@/lib/edit-requests";
import { useApiData } from "@/lib/use-api-data";

/** Loads one change request and hands it to the detail screen. */
export function EditRequestView({
  id,
  listPath,
}: {
  id: string;
  /** The list this was opened from, used for Back. */
  listPath: string;
}) {
  const { data, loading, error, retry } = useApiData(
    () => fetchEditRequest(id),
    [id],
  );

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading request…"
    >
      {data ? <EditRequestDetail request={data} listPath={listPath} /> : null}
    </ScreenState>
  );
}
