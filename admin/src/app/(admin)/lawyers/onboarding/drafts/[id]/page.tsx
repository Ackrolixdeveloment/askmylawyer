import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { ProfileOverview } from "@/components/lawyers/profile-overview";
import { getDraftDetail } from "@/data/mock-drafts";

export const metadata: Metadata = {
  title: "Draft Profile",
};

export default async function DraftProfilePage({
  params,
}: PageProps<"/lawyers/onboarding/drafts/[id]">) {
  const { id } = await params;
  const draft = getDraftDetail(id);

  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <ProfileOverview
          name={draft.name}
          statusLabel="Incomplete"
          statusTone="neutral"
          practiceType={draft.practiceType}
          email={draft.email}
          mobile={draft.mobile}
          tabs={draft.tabs}
          backHref="/lawyers/onboarding/drafts"
          backLabel="Back to Draft Profiles"
          footerCaption="Draft registration"
        />
      </main>
    </>
  );
}
