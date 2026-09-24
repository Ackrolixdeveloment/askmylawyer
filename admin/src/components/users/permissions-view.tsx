"use client";

import { ScreenState } from "@/components/common/screen-state";
import { PermissionMatrix } from "@/components/users/permission-matrix";
import { fetchPermissionCatalogue, fetchUserPermissions } from "@/lib/admin-users";
import { useApiData } from "@/lib/use-api-data";

/** What one admin user can reach. Access is set per person, not per role. */
export function PermissionsView({ id }: { id: string }) {
  const { data, loading, error, retry } = useApiData(
    () => Promise.all([fetchUserPermissions(id), fetchPermissionCatalogue()]),
    [id],
  );

  const [current, catalogue] = data ?? [];

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading permissions…"
    >
      {current && catalogue ? (
        <PermissionMatrix
          user={current.user}
          modules={catalogue.modules}
          levels={catalogue.levels}
          permissions={current.permissions}
        />
      ) : null}
    </ScreenState>
  );
}
