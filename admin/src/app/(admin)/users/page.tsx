import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { UsersView } from "@/components/users/users-view";

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

        <UsersView />
      </main>
    </>
  );
}
