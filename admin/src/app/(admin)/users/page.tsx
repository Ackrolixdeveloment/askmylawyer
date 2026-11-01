import { PageIntro } from "@/components/common/page-intro";
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
        <PageIntro
          title="Team & access"
          description="Manage administrators and control access to the workspace."
        />

        <UsersView />
      </main>
    </>
  );
}
