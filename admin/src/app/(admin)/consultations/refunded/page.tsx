import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { RefundedTable } from "@/components/consultations/refunded-table";
import {
  refundStatusOptions,
  refundedConsultations,
} from "@/data/mock-consultations";

export const metadata: Metadata = {
  title: "Refunded Consultations",
};

export default function RefundedConsultationsPage() {
  return (
    <>
      <Topbar title="Consultation Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[28px] sm:leading-9">
          Refunded Consultations
        </h1>

        <div className="mt-6">
          <RefundedTable
            consultations={refundedConsultations}
            statusOptions={refundStatusOptions}
          />
        </div>
      </main>
    </>
  );
}
