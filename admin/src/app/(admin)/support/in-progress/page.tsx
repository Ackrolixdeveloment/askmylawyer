import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { InProgressTicketsTable } from "@/components/support/in-progress-tickets-table";
import {
  categoryOptions,
  createdByOptions,
  inProgressTickets,
  priorityOptions,
} from "@/data/mock-tickets";

export const metadata: Metadata = {
  title: "In Progress Tickets",
};

export default function InProgressTicketsPage() {
  return (
    <>
      <Topbar title="Support" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[32px] sm:leading-10">
          In Progress
        </h1>

        <div className="mt-6">
          <InProgressTicketsTable
            tickets={inProgressTickets}
            priorityOptions={priorityOptions}
            createdByOptions={createdByOptions}
            categoryOptions={categoryOptions}
          />
        </div>
      </main>
    </>
  );
}
