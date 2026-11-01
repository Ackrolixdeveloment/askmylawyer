"use client";

import { ScreenState } from "@/components/common/screen-state";
import { PermissionMatrix } from "@/components/users/permission-matrix";
import {
  fetchPermissionCatalogue,
  fetchRolePermissions,
} from "@/lib/admin-users";
import { useApiData } from "@/lib/use-api-data";

/** The shared permissions inherited by every user assigned to a role. */
export function PermissionsView({ id }: { id: string }) {
  const { data, loading, error, retry } = useApiData(
    () => Promise.all([fetchRolePermissions(id), fetchPermissionCatalogue()]),
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
          key={current.role.id}
          user={{
            id: current.role.id,
            name: current.role.name,
            email: current.role.department || "No department",
            isSystemRole: current.role.isSystem,
          }}
          affectedUsers={current.role.users}
          modules={catalogue.modules}
          levels={catalogue.levels}
          permissions={current.permissions}
        />
      ) : null}
    </ScreenState>
  );
}
