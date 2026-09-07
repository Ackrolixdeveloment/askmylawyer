import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { BackButton } from "@/components/ui";
import { ConversationCard } from "@/components/support/detail/conversation-card";
import { PartyDetailsCard } from "@/components/support/detail/party-details-card";
import { TicketActionsPanel } from "@/components/support/detail/ticket-actions-panel";
import {
  ConsultationSummaryCard,
  IssueDescriptionCard,
  TicketDetailsCard,
} from "@/components/support/detail/ticket-info-cards";
import {
  assigneeOptions,
  departmentOptions,
  getTicketDetail,
  priorityOptions,
  refundActionOptions,
  statusOptions,
} from "@/data/mock-ticket-detail";

export const metadata: Metadata = {
  title: "Support Ticket",
};

export default async function TicketDetailPage({
  params,
  searchParams,
}: PageProps<"/support/tickets/[id]">) {
  const { id } = await params;
  const { mode } = await searchParams;

  // Read-only unless explicitly opened for editing.
  const editable = mode === "edit";
  const ticket = getTicketDetail(id);

  return (
    <>
      <Topbar title="Support" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <BackButton label="Support Ticket" fallbackHref="/support/new" />

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <TicketDetailsCard ticket={ticket} />
            <ConsultationSummaryCard ticket={ticket} />
            <IssueDescriptionCard ticket={ticket} />
            <ConversationCard
              messages={ticket.conversation}
              editable={editable}
              className="flex-1"
            />
          </div>

          <div className="space-y-4">
            <PartyDetailsCard title="Customer Details" party={ticket.customer} />
            <PartyDetailsCard title="Lawyer Details" party={ticket.lawyer} />
            <TicketActionsPanel
              ticket={ticket}
              editable={editable}
              statusOptions={statusOptions}
              priorityOptions={priorityOptions}
              assigneeOptions={assigneeOptions}
              departmentOptions={departmentOptions}
              refundActionOptions={refundActionOptions}
            />
          </div>
        </div>
      </main>
    </>
  );
}
