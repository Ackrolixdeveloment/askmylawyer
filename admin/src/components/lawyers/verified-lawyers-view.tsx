"use client";

import { ScreenState } from "@/components/common/screen-state";
import { VerifiedLawyersTable } from "@/components/lawyers/verified-lawyers-table";
import { fetchVerifiedLawyers } from "@/lib/lawyers";
import { useApiData } from "@/lib/use-api-data";

/** Approved lawyers, live to customers. */
export function VerifiedLawyersView() {
  const { data, loading, error, retry } = useApiData(() =>
    fetchVerifiedLawyers(),
  );

  const list = data;

  return (
    <>
      <div className="mt-6">
        <ScreenState
          loading={loading}
          error={error}
          onRetry={retry}
          loadingLabel="Loading lawyers…"
        >
          <div className="space-y-4">
            <VerifiedLawyersTable
              lawyers={list?.data ?? []}
              onChanged={retry}
            />
          </div>
        </ScreenState>
      </div>
    </>
  );
}
