import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { CustomersView } from "@/components/customers/customers-view";

export const metadata: Metadata = {
  title: "Customer Management",
};

export default function CustomerManagementPage() {
  return (
    <>
      <Topbar title="Customer Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[32px] sm:leading-10">
          Customer Management
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          View and manage all registered customers.
        </p>

        <CustomersView />
      </main>
    </>
  );
}
