import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { BillingTable } from "@/components/billing/billing-table";
import {
  billingRecords,
  billingStatusOptions,
  billingTypeOptions,
} from "@/data/mock-billing";

export const metadata: Metadata = {
  title: "Billing Management",
};

export default function BillingManagementPage() {
  return (
    <>
      <Topbar title="Billing Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[28px] sm:leading-9">
          Billing Management
        </h1>

        <div className="mt-6">
          <BillingTable
            records={billingRecords}
            statusOptions={billingStatusOptions}
            typeOptions={billingTypeOptions}
          />
        </div>
      </main>
    </>
  );
}
