"use client";

import { ScreenState } from "@/components/common/screen-state";
import { UserHeaderActions } from "@/components/users/user-header-actions";
import { UsersTable } from "@/components/users/users-table";
import { fetchAdminUsers, fetchRoles } from "@/lib/admin-users";
import { useApiData } from "@/lib/use-api-data";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/** The people who can sign in to this panel. */
export function UsersView() {
  const { data, loading, error, retry } = useApiData(() =>
    Promise.all([fetchAdminUsers(), fetchRoles()]),
  );

  const [users, roles] = data ?? [];
  const roleList = roles?.data ?? [];

  // Built-in roles are left out: there can only be one Super Admin, and the
  // backend refuses to hand the role to anyone else.
  const roleOptions = [
    { value: "", label: "Select a role" },
    ...roleList
      .filter((role) => !role.isSystem)
      .map((role) => ({ value: role.id, label: role.name })),
  ];

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-ink">Users</h2>
        <UserHeaderActions
          roleOptions={roleOptions}
          statusOptions={statusOptions}
          onCreated={retry}
        />
      </div>

      <div className="mt-4">
        <ScreenState
          loading={loading}
          error={error}
          onRetry={retry}
          loadingLabel="Loading users…"
        >
          <UsersTable
            users={users?.data ?? []}
            roles={roleList}
            onChanged={retry}
          />
        </ScreenState>
      </div>
    </>
  );
}
