import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { LawyerProfileView } from "@/components/lawyers/lawyer-profile-view";

export const metadata: Metadata = {
  title: "Lawyer Profile",
};

export default async function LawyerEditHistoryProfilePage({
  params,
}: PageProps<"/lawyers/edit-approvals/history/[id]">) {
  const { id } = await params;

  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <LawyerProfileView
          id={id}
          statusLabel="Active"
          statusTone="success"
          backHref="/lawyers/edit-approvals/history"
          backLabel="Back to Lawyer History"
          footerCaption="Lawyer profile"
        />
      </main>
    </>
  );
}
