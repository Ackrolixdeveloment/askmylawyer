import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { CategoriesView } from "@/components/users/categories-view";
import { categories } from "@/data/mock-categories";

export const metadata: Metadata = {
  title: "Category",
};

export default function CategoryPage() {
  return (
    <>
      <Topbar title="User Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <CategoriesView categories={categories} />
      </main>
    </>
  );
}
