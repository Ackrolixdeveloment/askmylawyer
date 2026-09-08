import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { ProfileOverview } from "@/components/lawyers/profile-overview";
import { getVerifiedLawyerDetail } from "@/data/mock-lawyers";

export const metadata: Metadata = {
  title: "Lawyer Profile",
};

export default async function VerifiedLawyerPage({
  params,
}: PageProps<"/lawyers/verified/[id]">) {
  const { id } = await params;
  const lawyer = getVerifiedLawyerDetail(id);

  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <ProfileOverview
          name={lawyer.name}
          statusLabel={lawyer.status === "active" ? "Active" : "Suspended"}
          statusTone={lawyer.status === "active" ? "success" : "danger"}
          practiceType={lawyer.practiceType}
          email={lawyer.email}
          mobile={lawyer.mobile}
          tabs={lawyer.tabs}
          backHref="/lawyers/verified"
          backLabel="Back to Verified Lawyers"
          footerCaption="Verified lawyer"
        />
      </main>
    </>
  );
}
