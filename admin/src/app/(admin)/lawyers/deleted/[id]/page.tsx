import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { LawyerProfileView } from "@/components/lawyers/lawyer-profile-view";

export const metadata: Metadata = {
  title: "Deleted Lawyer",
};

export default async function DeletedLawyerProfilePage({
  params,
}: PageProps<"/lawyers/deleted/[id]">) {
  const { id } = await params;

  return (
    <>
      <Topbar title="Lawyer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <LawyerProfileView
          id={id}
          statusLabel="Deleted"
          statusTone="neutral"
          backHref="/lawyers/deleted"
          backLabel="Back to Deleted Lawyers"
          footerCaption="Deleted lawyer"
        />
      </main>
    </>
  );
}
