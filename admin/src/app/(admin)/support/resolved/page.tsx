import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { ResolvedTicketsTable } from "@/components/support/resolved-tickets-table";
import {
  categoryOptions,
  createdByOptions,
  priorityOptions,
  resolvedTickets,
} from "@/data/mock-tickets";

export const metadata: Metadata = {
  title: "Resolved Tickets",
};

export default function ResolvedTicketsPage() {
  return (
    <>
      <Topbar title="Support" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <h1 className="text-2xl leading-8 font-bold text-ink sm:text-[32px] sm:leading-10">
          Resolved
        </h1>

        <div className="mt-6">
          <ResolvedTicketsTable
            tickets={resolvedTickets}
            priorityOptions={priorityOptions}
            createdByOptions={createdByOptions}
            categoryOptions={categoryOptions}
          />
        </div>
      </main>
    </>
  );
}
