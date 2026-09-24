"use client";

import {
  Building2,
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock,
  Download,
  Eye,
  FileText,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Badge,
  BackButton,
  Button,
  Card,
  Modal,
  type BadgeTone,
} from "@/components/ui";
import { useAdmin } from "@/components/layout/auth-guard";
import { ApiError } from "@/lib/api";
import { canChange } from "@/lib/auth";
import {
  approveEditRequest,
  editRequestProofUrl,
  rejectEditRequest,
} from "@/lib/edit-requests";
import { formatDdMmYyyy } from "@/lib/format";
import type { EditChange, EditRequest, EditRequestStatus } from "@/types/edit-request";

const statusTone: Record<EditRequestStatus, BadgeTone> = {
  pending: "refunded",
  approved: "success",
  rejected: "danger",
};

const statusLabel: Record<EditRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function StatusBadge({ status }: { status: EditRequestStatus }) {
  const Icon =
    status === "approved" ? CircleCheck : status === "rejected" ? CircleX : Clock;

  return (
    <Badge tone={statusTone[status]} className="gap-1.5">
      <Icon className="size-3.5" aria-hidden />
      {statusLabel[status]}
    </Badge>
  );
}

export function EditRequestDetail({
  request,
  listPath,
}: {
  request: EditRequest;
  /** The list this was opened from, used for Back. */
  listPath: string;
}) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pending = request.status === "pending";
  const canDecide = canChange(useAdmin(), "lawyers");

  /** Saves the decision, then moves to the list it now belongs to. */
  async function decide(action: () => Promise<unknown>, destination: string) {
    setBusy(true);
    setError("");

    try {
      await action();
      router.push(destination);
      router.refresh();
    } catch (caught) {
      setBusy(false);
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not save the decision. Please try again.",
      );
    }
  }

  function approve() {
    void decide(
      () => approveEditRequest(request.id),
      "/lawyers/edit-approvals/approved",
    );
  }

  function submitRejection() {
    if (reason.trim().length < 5) return;
    setRejecting(false);
    void decide(
      () => rejectEditRequest(request.id, reason.trim()),
      "/lawyers/edit-approvals/rejected",
    );
  }

  return (
    <div className="space-y-4">
      <BackButton fallbackHref={listPath} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl leading-8 font-bold text-ink">
            Edit Request Details
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Request ID: {request.requestId}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={request.status} />

          {error ? (
            <p role="alert" className="w-full text-sm text-negative">
              {error}
            </p>
          ) : null}

          {/* Actions disappear once decided, or without full access. */}
          {pending && canDecide ? (
            <>
              <Button
                onClick={approve}
                disabled={busy}
                className="bg-positive hover:bg-emerald-700"
              >
                <CircleCheck className="size-4" aria-hidden />
                {busy ? "Saving…" : "Approve"}
              </Button>
              <Button
                onClick={() => setRejecting(true)}
                disabled={busy}
                className="bg-red-600 hover:bg-red-700"
              >
                <CircleX className="size-4" aria-hidden />
                Reject
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
              <User className="size-5 text-brand" aria-hidden />
              Lawyer Information
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <Pair label="Lawyer Name">
                <span className="font-semibold">{request.lawyerName}</span>
              </Pair>
              <Pair label="Email" icon={Mail}>
                {request.lawyerEmail}
              </Pair>
              <Pair label="Mobile Number" icon={Phone}>
                {request.lawyerMobile}
              </Pair>
              <Pair label="Lawyer ID">{request.lawyerId}</Pair>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
              <Building2 className="size-5 text-brand" aria-hidden />
              Requested Changes
            </h2>

            <div className="mt-4 space-y-4">
              {request.changes.map((change) => (
                <ChangeRow
              key={change.field}
              change={change}
              proofHref={editRequestProofUrl(request.id)}
            />
              ))}
            </div>
          </Card>

          {request.status === "rejected" && request.feedback ? (
            <Card className="border-red-200 bg-red-50/60 p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-negative">
                <CircleX className="size-5" aria-hidden />
                Rejection Reason
              </h2>
              <p className="mt-3 text-sm text-negative">{request.feedback}</p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Request Summary</h2>

            <dl className="mt-4 space-y-4">
              <SummaryRow label="Section Type">
                <Badge tone="info">{request.section}</Badge>
              </SummaryRow>
              <SummaryRow label="Request Status">
                <StatusBadge status={request.status} />
              </SummaryRow>
              <SummaryRow label="Requested At">
                <span className="flex items-center gap-1.5 text-sm text-ink">
                  <CalendarDays className="size-4 text-ink-muted" aria-hidden />
                  {formatDdMmYyyy(request.requestedAt)}
                </span>
              </SummaryRow>

              {request.decidedAt ? (
                <SummaryRow
                  label={
                    request.status === "approved" ? "Approved At" : "Rejected At"
                  }
                >
                  <span className="flex items-center gap-1.5 text-sm text-ink">
                    <CalendarDays className="size-4 text-ink-muted" aria-hidden />
                    {formatDdMmYyyy(request.decidedAt)}
                  </span>
                </SummaryRow>
              ) : null}

              <SummaryRow label="Changes Count">
                <span className="text-sm font-semibold text-ink">
                  {request.changes.length} field(s)
                </span>
              </SummaryRow>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Timeline</h2>

            <ol className="mt-4 space-y-4">
              <TimelineItem
                title="Request Submitted"
                date={request.requestedAt}
                tone="bg-brand"
              />
              {request.status !== "pending" && request.decidedAt ? (
                <TimelineItem
                  title={
                    request.status === "approved"
                      ? "Request Approved"
                      : "Request Rejected"
                  }
                  date={request.decidedAt}
                  tone={
                    request.status === "approved" ? "bg-positive" : "bg-negative"
                  }
                />
              ) : null}
            </ol>
          </Card>
        </div>
      </div>

      <Modal
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="Reject edit request"
        description="The reason is shared with the lawyer."
        footer={
          <>
            <Button variant="outline" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitRejection}
              disabled={reason.trim().length < 5 || busy}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject request
            </Button>
          </>
        }
      >
        <label
          htmlFor="rejection-feedback"
          className="text-sm font-medium text-ink"
        >
          Admin feedback
        </label>
        <textarea
          id="rejection-feedback"
          rows={3}
          autoFocus
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Tell the lawyer why this change was not accepted..."
          className="mt-2 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-negative focus:ring-2 focus:ring-red-100 focus:outline-none"
        />
      </Modal>
    </div>
  );
}

function Pair({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink">
        {Icon ? <Icon className="size-4 text-ink-muted" aria-hidden /> : null}
        {children}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-1.5">{children}</dd>
    </div>
  );
}

function TimelineItem({
  title,
  date,
  tone,
}: {
  title: string;
  date: string;
  tone: string;
}) {
  return (
    <li className="flex gap-3">
      <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${tone}`} aria-hidden />
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{formatDdMmYyyy(date)}</p>
      </div>
    </li>
  );
}

/** Current vs requested value, side by side. Documents show a file card. */
function ChangeRow({
  change,
  proofHref,
}: {
  change: EditChange;
  /** Where the submitted document can be opened. */
  proofHref: string;
}) {
  return (
    <div className="rounded-xl border border-line p-4">
      <p className="text-sm font-semibold text-ink">{change.field}</p>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-ink-muted">Current Value</p>
          {change.isDocument ? (
            <DocumentCard name={change.currentValue} />
          ) : (
            <p className="mt-1.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink">
              {change.currentValue}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs text-ink-muted">Requested Value</p>
          {change.isDocument ? (
            <DocumentCard
              name={change.requestedValue}
              highlighted
              href={proofHref}
            />
          ) : (
            <p className="mt-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-ink">
              {change.requestedValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentCard({
  name,
  highlighted = false,
  href,
}: {
  /** Only the submitted document can be opened; the old one is already live. */
  href?: string;
  name: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`mt-1.5 flex flex-wrap items-center gap-3 rounded-lg border p-3 ${
        highlighted ? "border-blue-200 bg-blue-50" : "border-line bg-surface"
      }`}
    >
      <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-slate-100 text-ink-subtle">
        <FileText className="size-6" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-ink">{name}</p>
        {href ? (
          <div className="mt-1.5 flex flex-wrap gap-3">
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              <Eye className="size-3.5" aria-hidden />
              View Full
            </a>
            <a
              href={href}
              download
              className="inline-flex items-center gap-1 text-xs font-medium text-positive hover:underline"
            >
              <Download className="size-3.5" aria-hidden />
              Download
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
