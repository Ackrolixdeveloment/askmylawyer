import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { EditHistoryTable } from "@/components/lawyers/edit-history-table";
import { lawyerEditHistory } from "@/data/mock-edit-history";

export const metadata: Metadata = {
  title: "Lawyer Edit History",
};

export default function LawyerEditHistoryPage() {
  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink">Lawyer Edit History</h1>
        <p className="mt-1 text-sm text-ink-muted">View all lawyers who have submitted profile change requests</p>

        <div className="mt-6">
          <EditHistoryTable
            rows={lawyerEditHistory}
            status="active"
            basePath="/lawyers/edit-approvals/history"
          />
        </div>
      </main>
    </>
  );
}
