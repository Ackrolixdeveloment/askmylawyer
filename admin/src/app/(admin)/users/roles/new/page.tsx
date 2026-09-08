import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { BackButton } from "@/components/ui";
import { RoleForm } from "@/components/users/role-form";
import { roles } from "@/data/mock-users";

export const metadata: Metadata = {
  title: "Create Role",
};

export default function AddRolePage() {
  return (
    <>
      <Topbar title="User Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <BackButton label="Back to Users" fallbackHref="/users" />
          <Link
            href="/users"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Users className="size-[18px]" aria-hidden />
            View Users
          </Link>
        </div>

        <h1 className="mt-4 text-2xl leading-8 font-bold text-ink">
          User Management
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Create a new role</p>

        <div className="mt-6 max-w-5xl">
          <RoleForm roles={roles} />
        </div>
      </main>
    </>
  );
}
