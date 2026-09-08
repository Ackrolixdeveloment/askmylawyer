import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { UsersTable } from "@/components/users/users-table";
import { adminUsers } from "@/data/mock-users";

export const metadata: Metadata = {
  title: "User Management",
};

const actionClasses =
  "inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none";

export default function UserManagementPage() {
  return (
    <>
      <Topbar title="User Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[28px] sm:leading-9">
          User Management
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage system users and their access
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink">Users</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/users/new" className={actionClasses}>
              <Plus className="size-[18px]" aria-hidden />
              Add User
            </Link>
            <Link href="/users/roles/new" className={actionClasses}>
              <Plus className="size-[18px]" aria-hidden />
              Add Role
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <UsersTable users={adminUsers} />
        </div>
      </main>
    </>
  );
}
