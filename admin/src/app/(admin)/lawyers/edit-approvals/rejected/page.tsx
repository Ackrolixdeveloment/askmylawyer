import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { EditRequestsTable } from "@/components/lawyers/edit-requests-table";
import { periodOptions } from "@/data/mock-edit-requests";

export const metadata: Metadata = {
  title: "Rejected Edit Requests",
};

export default function RejectedEditRequestsPage() {
  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[28px] sm:leading-9">
          Rejected
        </h1>

        <div className="mt-6">
          <EditRequestsTable status="rejected" periodOptions={periodOptions} />
        </div>
      </main>
    </>
  );
}
