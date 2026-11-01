import { PageIntro } from "@/components/common/page-intro";
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { DisputesView } from "@/components/consultations/disputes-view";
import { disputes, lawyerFlags } from "@/data/mock-disputes";

export const metadata: Metadata = {
  title: "Disputes & Flags",
};

export default function DisputedConsultationsPage() {
  return (
    <>
      <Topbar title="Consultation Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <PageIntro
          title="Disputes & quality"
          description="Review concerns, document decisions and follow up with the right person."
        />

        <div className="mt-6">
          <DisputesView disputes={disputes} flags={lawyerFlags} />
        </div>
      </main>
    </>
  );
}
