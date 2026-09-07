import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { ActivityTimeline } from "@/components/customers/detail/activity-timeline";
import { CustomerDetailHeader } from "@/components/customers/detail/customer-detail-header";
import {
  ConsultationHistoryCard,
  RefundHistoryCard,
  SupportTicketsCard,
  TransactionHistoryCard,
} from "@/components/customers/detail/history-cards";
import { PersonalInformationCard } from "@/components/customers/detail/personal-information-card";
import { ReferralsCard } from "@/components/customers/detail/referrals-card";
import { BackButton } from "@/components/ui";
import { getCustomerDetail } from "@/data/mock-customer-detail";

export const metadata: Metadata = {
  title: "Customer Detail",
};

export default async function CustomerDetailPage({
  params,
}: PageProps<"/customers/[id]">) {
  const { id } = await params;
  const customer = getCustomerDetail(id);

  return (
    <>
      <Topbar title="Customer Management" />

      <main className="min-w-0 space-y-4 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <BackButton fallbackHref="/customers" />

        <CustomerDetailHeader customer={customer} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <PersonalInformationCard customer={customer} />
            <TransactionHistoryCard rows={customer.transactions} />
            <SupportTicketsCard rows={customer.supportTickets} />
            <RefundHistoryCard rows={customer.refunds} />
          </div>

          <div className="space-y-4">
            <ReferralsCard referral={customer.referral} />
            <ActivityTimeline events={customer.timeline} />
          </div>
        </div>

        <ConsultationHistoryCard
          rows={customer.consultations}
          total={customer.consultationTotal}
        />
      </main>
    </>
  );
}