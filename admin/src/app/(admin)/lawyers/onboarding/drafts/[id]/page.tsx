import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { DraftProfileView } from "@/components/lawyers/draft-profile-view";

export const metadata: Metadata = {
  title: "Draft Profile",
};

export default async function DraftProfilePage({
  params,
}: PageProps<"/lawyers/onboarding/drafts/[id]">) {
  const { id } = await params;

  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <DraftProfileView id={id} />
      </main>
    </>
  );
}
