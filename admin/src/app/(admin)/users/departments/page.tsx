import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { DepartmentsView } from "@/components/users/departments-view";

export const metadata: Metadata = {
  title: "Departments",
};

export default function DepartmentsPage() {
  return (
    <>
      <Topbar title="User Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <DepartmentsView />
      </main>
    </>
  );
}
