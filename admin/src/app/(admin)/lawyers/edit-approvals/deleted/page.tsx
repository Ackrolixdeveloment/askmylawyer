import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { DeletedLawyersTable } from "@/components/lawyers/deleted-lawyers-table";
import { deletedLawyers } from "@/data/mock-edit-history";

export const metadata: Metadata = {
  title: "Deleted Lawyers",
};

export default function DeletedLawyersPage() {
  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink">Deleted Lawyers</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Read-only records of lawyer accounts that were removed
        </p>

        <div className="mt-6">
          <DeletedLawyersTable rows={deletedLawyers} />
        </div>
      </main>
    </>
  );
}
