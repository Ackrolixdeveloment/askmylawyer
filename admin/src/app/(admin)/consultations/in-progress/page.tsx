import { PageIntro } from "@/components/common/page-intro";
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { InProgressConsultationsView } from "@/components/consultations/consultation-views";

export const metadata: Metadata = {
  title: "In Progress Consultations",
};

export default function Page() {
  return (
    <>
      <Topbar title="Consultation Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <PageIntro
          title="In progress consultations"
          description="Track matching, preparation, waiting-to-join and ongoing sessions."
        />

        <div className="mt-6">
          <InProgressConsultationsView />
        </div>
      </main>
    </>
  );
}
