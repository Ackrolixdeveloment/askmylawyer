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
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[28px] sm:leading-9">
          Dispute &amp; flags
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{disputes.length} total</p>

        <div className="mt-6">
          <DisputesView disputes={disputes} flags={lawyerFlags} />
        </div>
      </main>
    </>
  );
}
