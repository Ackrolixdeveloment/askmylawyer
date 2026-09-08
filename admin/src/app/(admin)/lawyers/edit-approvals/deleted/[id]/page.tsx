import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { ProfileOverview } from "@/components/lawyers/profile-overview";
import { getDeletedProfile } from "@/data/mock-edit-history";

export const metadata: Metadata = {
  title: "Deleted Lawyer",
};

export default async function DeletedLawyerProfilePage({
  params,
}: PageProps<"/lawyers/edit-approvals/deleted/[id]">) {
  const { id } = await params;
  const lawyer = getDeletedProfile(id);

  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <ProfileOverview
          name={lawyer.name}
          statusLabel="Deleted"
          statusTone="neutral"
          practiceType={lawyer.practiceType}
          email={lawyer.email}
          mobile={lawyer.phone}
          tabs={lawyer.tabs}
          backHref="/lawyers/edit-approvals/deleted"
          backLabel="Back to Deleted Lawyers"
          footerCaption="Deleted lawyer"
        />
      </main>
    </>
  );
}
