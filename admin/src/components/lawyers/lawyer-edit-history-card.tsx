"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, History } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { LawyerEditHistoryEntry } from "@/types/edit-request";

const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
const labels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
} as const;
/** This lawyer's request history; never a cross-lawyer overview. */
export function LawyerEditHistoryCard({
  entries,
  currentRequestId,
}: {
  entries?: LawyerEditHistoryEntry[];
  currentRequestId: string;
}) {
  const [page, setPage] = useState(1);
  const total = entries?.length ?? 0;
  const pages = Math.max(1, Math.ceil(total / 5));
  const activePage = Math.min(page, pages);
  return (
    <Card className="min-w-0 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <History className="size-4 text-brand" />
          Lawyer Edit History
        </h2>
        <span className="text-xs text-ink-muted">{total} requests</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-ink-muted">
        All edit requests from this lawyer, newest first. Dates and times are in
        IST.
      </p>
      {!entries ? (
        <p className="mt-4 text-sm text-ink-muted">
          Edit history is unavailable. Refresh after the API is updated.
        </p>
      ) : !total ? (
        <p className="mt-4 text-sm text-ink-muted">
          No edit requests recorded.
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-line">
          {entries.slice((activePage - 1) * 5, activePage * 5).map((entry) => (
            <li key={entry.id} className="min-w-0 py-4 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-ink">
                    {entry.section}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-ink-muted">
                    {entry.requestId}
                  </p>
                </div>
                <Badge
                  tone={
                    entry.status === "approved"
                      ? "success"
                      : entry.status === "rejected"
                        ? "danger"
                        : "info"
                  }
                >
                  {labels[entry.status]}
                </Badge>
              </div>
              <dl className="mt-3 space-y-2 text-xs">
                <div>
                  <dt className="text-ink-subtle">Requested</dt>
                  <dd className="mt-0.5 text-ink">
                    {dateTime(entry.requestedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-subtle">
                    {entry.status === "pending"
                      ? "Decision"
                      : labels[entry.status] + " on"}
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {entry.status === "pending"
                      ? "Awaiting review"
                      : entry.decidedAt
                        ? dateTime(entry.decidedAt)
                        : "Date not recorded"}
                  </dd>
                </div>
                {entry.status !== "pending" && (
                  <div>
                    <dt className="text-ink-subtle">
                      {labels[entry.status]} by
                    </dt>
                    <dd className="mt-0.5 break-words text-ink">
                      {entry.decidedBy
                        ? `${entry.decidedBy.name} · ${entry.decidedBy.employeeCode}`
                        : "Reviewer not recorded"}
                    </dd>
                  </div>
                )}
              </dl>
              <div className="mt-3 flex items-center justify-between gap-2">
                {entry.id === currentRequestId ? (
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-brand">
                    Current request
                  </span>
                ) : (
                  <Link
                    href={`/lawyers/edit-approvals/${entry.status}/${entry.id}`}
                    title="View detail"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand"
                  >
                    <Eye className="size-3.5" />
                    View request
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3 text-xs">
          <button
            className="table-tool"
            disabled={activePage === 1}
            onClick={() => setPage(activePage - 1)}
          >
            Previous
          </button>
          <span className="text-ink-muted">
            {activePage} / {pages}
          </span>
          <button
            className="table-tool"
            disabled={activePage === pages}
            onClick={() => setPage(activePage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </Card>
  );
}
