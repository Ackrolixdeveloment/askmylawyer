import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { RolesView } from "@/components/users/roles-view";
import { adminRoles } from "@/data/mock-categories";

export const metadata: Metadata = {
  title: "Role",
};

export default function RolesPage() {
  return (
    <>
      <Topbar title="User Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <RolesView roles={adminRoles} />
      </main>
    </>
  );
}
