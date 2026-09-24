import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { CategoriesView } from "@/components/users/categories-view";

export const metadata: Metadata = {
  title: "Categories",
};

export default function CategoriesPage() {
  return (
    <>
      <Topbar title="User Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <CategoriesView />
      </main>
    </>
  );
}
