"use client";

import { useState } from "react";
import { Button, Card, FilterSelect, type SelectOption } from "@/components/ui";
import type { TicketDetail } from "@/types/ticket-detail";

interface TicketActionsPanelProps {
  ticket: TicketDetail;
  /** False on the read-only view: values render as plain text, no buttons. */
  editable: boolean;
  statusOptions: SelectOption[];
  priorityOptions: SelectOption[];
  assigneeOptions: SelectOption[];
  departmentOptions: SelectOption[];
  refundActionOptions: SelectOption[];
}

/** Coloured dot matching the selected status/priority, as in the design. */
const dotColor: Record<string, string> = {
  "In Progress": "bg-warn",
  Resolved: "bg-positive",
  Closed: "bg-ink-subtle",
  Escalated: "bg-negative",
  High: "bg-negative",
  Medium: "bg-warn",
  Low: "bg-positive",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-ink-muted">{label}</p>
      {children}
    </div>
  );
}

/** Read-only rendering of a value, with the status dot where relevant. */
function ReadOnlyValue({ value }: { value: string }) {
  return (
    <p className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-ink">
      {dotColor[value] ? (
        <span className={`size-2 rounded-full ${dotColor[value]}`} aria-hidden />
      ) : null}
      {value}
    </p>
  );
}

export function TicketActionsPanel({
  ticket,
  editable,
  statusOptions,
  priorityOptions,
  assigneeOptions,
  departmentOptions,
  refundActionOptions,
}: TicketActionsPanelProps) {
  const [status, setStatus] = useState<string>(ticket.status);
  const [priority, setPriority] = useState<string>(ticket.priority);
  const [assignee, setAssignee] = useState(ticket.assignedTo);
  const [department, setDepartment] = useState(ticket.actions.department);
  const [refundAction, setRefundAction] = useState(ticket.actions.refundAction);
  const [resolution, setResolution] = useState(ticket.actions.resolution);

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Ticket Actions</h2>

      <div className="mt-4 space-y-4">
        <Field label="Status">
          {editable ? (
            <FilterSelect
              size="sm"
              aria-label="Ticket status"
              options={statusOptions}
              value={status}
              onChange={setStatus}
            />
          ) : (
            <ReadOnlyValue value={status} />
          )}
        </Field>

        <Field label="Priority">
          {editable ? (
            <FilterSelect
              size="sm"
              aria-label="Ticket priority"
              options={priorityOptions}
              value={priority}
              onChange={setPriority}
            />
          ) : (
            <ReadOnlyValue value={priority} />
          )}
        </Field>

        <Field label="Assign To">
          {editable ? (
            <FilterSelect
              size="sm"
              aria-label="Assign to"
              options={assigneeOptions}
              value={assignee}
              onChange={setAssignee}
            />
          ) : (
            <ReadOnlyValue value={assignee} />
          )}
        </Field>

        <Field label="Department">
          {editable ? (
            <FilterSelect
              size="sm"
              aria-label="Department"
              options={departmentOptions}
              value={department}
              onChange={setDepartment}
            />
          ) : (
            <ReadOnlyValue value={department} />
          )}
        </Field>

        <Field label="Refund Action">
          {editable ? (
            <FilterSelect
              size="sm"
              aria-label="Refund action"
              options={refundActionOptions}
              value={refundAction}
              onChange={setRefundAction}
            />
          ) : (
            <ReadOnlyValue value={refundAction} />
          )}
        </Field>

        <Field label="Resolution">
          {editable ? (
            <textarea
              rows={3}
              value={resolution}
              aria-label="Resolution"
              onChange={(event) => setResolution(event.target.value)}
              className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
            />
          ) : (
            <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-ink">
              {resolution}
            </p>
          )}
        </Field>
      </div>

      {editable ? (
        <div className="mt-5 space-y-2.5">
          {/* TODO: wire each action to the API. */}
          <Button className="w-full">Resolve Ticket</Button>
          <Button variant="outline" className="w-full">
            Save Changes
          </Button>
          <Button
            variant="outline"
            className="w-full border-red-200 text-negative hover:bg-red-50"
          >
            Close Ticket
          </Button>
        </div>
      ) : null}
    </Card>
  );
}