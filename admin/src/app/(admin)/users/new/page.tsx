import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { BackButton } from "@/components/ui";
import { UserForm } from "@/components/users/user-form";
import { roleOptions, statusOptions } from "@/data/mock-users";

export const metadata: Metadata = {
  title: "Add New User",
};

export default function AddUserPage() {
  return (
    <>
      <Topbar title="User Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <BackButton label="Back to Users" fallbackHref="/users" />

        <h1 className="mt-4 text-2xl leading-8 font-bold text-ink">
          Add New User
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Create a new user account for the system
        </p>

        <div className="mt-6 max-w-3xl">
          <UserForm roleOptions={roleOptions} statusOptions={statusOptions} />
        </div>
      </main>
    </>
  );
}
