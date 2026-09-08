import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { ProfileOverview } from "@/components/lawyers/profile-overview";
import { getHistoryProfile } from "@/data/mock-edit-history";

export const metadata: Metadata = {
  title: "Lawyer Profile",
};

export default async function LawyerEditHistoryProfilePage({
  params,
}: PageProps<"/lawyers/edit-approvals/history/[id]">) {
  const { id } = await params;
  const lawyer = getHistoryProfile(id);

  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <ProfileOverview
          name={lawyer.name}
          statusLabel={lawyer.status === "deleted" ? "Deleted" : "Active"}
          statusTone={lawyer.status === "deleted" ? "neutral" : "success"}
          practiceType={lawyer.practiceType}
          email={lawyer.email}
          mobile={lawyer.mobile}
          tabs={lawyer.tabs}
          backHref="/lawyers/edit-approvals/history"
          backLabel="Back to Lawyer History"
          footerCaption="Lawyer profile"
        />
      </main>
    </>
  );
}
