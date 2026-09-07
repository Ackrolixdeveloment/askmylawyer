import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { NewTicketsTable } from "@/components/support/new-tickets-table";
import {
  categoryOptions,
  createdByOptions,
  newTickets,
  priorityOptions,
} from "@/data/mock-tickets";

export const metadata: Metadata = {
  title: "New Tickets",
};

export default function NewTicketsPage() {
  return (
    <>
      <Topbar title="Support" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[32px] sm:leading-10">
          New Tickets
        </h1>

        <div className="mt-6">
          <NewTicketsTable
            tickets={newTickets}
            priorityOptions={priorityOptions}
            createdByOptions={createdByOptions}
            categoryOptions={categoryOptions}
          />
        </div>
      </main>
    </>
  );
}
