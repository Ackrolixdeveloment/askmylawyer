import { PageIntro } from "@/components/common/page-intro";
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
        <PageIntro
          title="Resolved support cases"
          description="Review outcomes and the history behind each resolution."
        />

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
