import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { EditRequestView } from "@/components/lawyers/edit-request-view";

export const metadata: Metadata = {
  title: "Edit Request Details",
};

export default async function RejectedEditRequestsDetailPage({
  params,
}: PageProps<"/lawyers/edit-approvals/rejected/[id]">) {
  const { id } = await params;

  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        {/* Nested under the list so the sidebar keeps it highlighted. */}
        <EditRequestView
          id={id}
          listPath="/lawyers/edit-approvals/rejected"
        />
      </main>
    </>
  );
}
