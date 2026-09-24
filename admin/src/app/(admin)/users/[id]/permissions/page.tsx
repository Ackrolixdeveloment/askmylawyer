import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { BackButton } from "@/components/ui";
import { PermissionsView } from "@/components/users/permissions-view";

export const metadata: Metadata = {
  title: "Manage Permission",
};

export default async function ManagePermissionPage({
  params,
}: PageProps<"/users/[id]/permissions">) {
  const { id } = await params;

  return (
    <>
      <Topbar title="User Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <BackButton fallbackHref="/users" label="Back to Users" />

        <h1 className="mt-3 text-2xl leading-8 font-bold text-ink sm:text-[28px] sm:leading-9">
          Manage Permission
        </h1>

        <div className="mt-6">
          <PermissionsView id={id} />
        </div>
      </main>
    </>
  );
}
