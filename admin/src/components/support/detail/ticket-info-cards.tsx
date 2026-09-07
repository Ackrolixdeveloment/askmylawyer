import { Download, Eye, FileText } from "lucide-react";
import { Badge, Card, type BadgeTone } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { TicketDetail } from "@/types/ticket-detail";

/** Small label above a value; `align` mirrors the pair on the right column. */
function Pair({
  label,
  align = "left",
  children,
}: {
  label: string;
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className="text-xs text-ink-muted">{label}</p>
      <div className="mt-1 text-sm text-ink">{children}</div>
    </div>
  );
}

const priorityTone: Record<TicketDetail["priority"], BadgeTone> = {
  High: "danger",
  Medium: "refunded",
  Low: "success",
};

export function TicketDetailsCard({ ticket }: { ticket: TicketDetail }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Ticket Details</h2>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
        <Pair label="Ticket ID">{ticket.ticketId}</Pair>
        <Pair label="Status" align="right">
          <Badge tone="refunded">{ticket.status}</Badge>
        </Pair>

        <Pair label="Subject">
          <span className="font-medium">{ticket.subject}</span>
        </Pair>
        <Pair label="Priority" align="right">
          <Badge tone={priorityTone[ticket.priority]}>{ticket.priority}</Badge>
        </Pair>

        <Pair label="Category">{ticket.category}</Pair>
        <Pair label="Sub Category" align="right">
          {ticket.subCategory}
        </Pair>

        <Pair label="Created on">{ticket.createdOn}</Pair>
        <Pair label="Last Updated" align="right">
          {ticket.lastUpdated}
        </Pair>

        <Pair label="Ticket Source">{ticket.source}</Pair>
        <Pair label="Assigned To" align="right">
          {ticket.assignedTo}
        </Pair>
      </div>
    </Card>
  );
}

export function ConsultationSummaryCard({ ticket }: { ticket: TicketDetail }) {
  const { consultation } = ticket;

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Consultation Summary</h2>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
        <Pair label="Consultation ID">{consultation.consultationId}</Pair>
        <Pair label="Booking No">{consultation.bookingNo}</Pair>
        <Pair label="Date">{consultation.date}</Pair>
        <Pair label="Time">{consultation.time}</Pair>
        <Pair label="Duration">{consultation.duration}</Pair>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <Pair label="Type">{consultation.type}</Pair>
        <Pair label="Payment">{consultation.payment}</Pair>
        <Pair label="Payment Status">
          <Badge tone="refunded">{consultation.paymentStatus}</Badge>
        </Pair>
        <Pair label="Consultation Status">
          <Badge tone="success">{consultation.consultationStatus}</Badge>
        </Pair>
      </div>
    </Card>
  );
}

export function IssueDescriptionCard({ ticket }: { ticket: TicketDetail }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Issue Description</h2>

      <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-ink-muted">
        {ticket.issueDescription}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ticket.attachments.map((file) => (
          <div
            key={file.name}
            className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5"
          >
            <FileText className="size-5 shrink-0 text-ink-subtle" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink">{file.name}</p>
              <p className="text-xs text-ink-subtle">{file.size}</p>
            </div>
            <button
              type="button"
              aria-label={
                file.previewable ? `Preview ${file.name}` : `Download ${file.name}`
              }
              className="rounded-lg border border-line p-1.5 text-ink-muted transition-colors hover:bg-slate-50 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              {file.previewable ? (
                <Eye className="size-4" aria-hidden />
              ) : (
                <Download className="size-4" aria-hidden />
              )}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}