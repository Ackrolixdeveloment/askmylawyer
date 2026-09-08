import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { BackButton } from "@/components/ui";
import {
  BillingDetailHeader,
  ConsultationDetailsCard,
  InvoicePreviewCard,
  PartiesCard,
  PaymentBreakdownCard,
} from "@/components/billing/detail/billing-detail-sections";
import { getBillingDetail } from "@/data/mock-billing-detail";

export const metadata: Metadata = {
  title: "Billing Detail",
};

export default async function BillingDetailPage({
  params,
  searchParams,
}: PageProps<"/billing/[id]">) {
  const { id } = await params;
  const { mode } = await searchParams;

  // Read-only unless explicitly opened for editing.
  const editable = mode === "edit";
  const record = getBillingDetail(id);

  return (
    <>
      <Topbar title="Billing Management" />

      <main className="min-w-0 space-y-4 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <BackButton fallbackHref="/billing" />

        <BillingDetailHeader record={record} editable={editable} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <div className="space-y-4">
            <ConsultationDetailsCard record={record} />
            <PaymentBreakdownCard record={record} />
          </div>

          <div className="space-y-4">
            <PartiesCard record={record} />
            <InvoicePreviewCard record={record} />
          </div>
        </div>
      </main>
    </>
  );
}
