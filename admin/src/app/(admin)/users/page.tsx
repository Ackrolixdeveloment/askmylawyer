import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { UserHeaderActions } from "@/components/users/user-header-actions";
import { UsersTable } from "@/components/users/users-table";
import {
  adminUsers,
  roleOptions,
  roles,
  statusOptions,
} from "@/data/mock-users";

export const metadata: Metadata = {
  title: "User Management",
};

export default function UserManagementPage() {
  return (
    <>
      <Topbar title="User Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[28px] sm:leading-9">
          User Management
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage admin users, roles and access permissions.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink">Users</h2>
          <UserHeaderActions
            roleOptions={roleOptions}
            statusOptions={statusOptions}
            roles={roles}
          />
        </div>

        <div className="mt-4">
          <UsersTable users={adminUsers} />
        </div>
      </main>
    </>
  );
}
