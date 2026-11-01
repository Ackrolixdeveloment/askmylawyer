"use client";

import { PreviewAction } from "@/components/ui/preview-action";
import { RefreshCw } from "lucide-react";
import { use, useMemo } from "react";
import { ScreenState } from "@/components/common/screen-state";
import { Topbar } from "@/components/layout/topbar";
import { BackButton, Card } from "@/components/ui";
import { fetchConsultation, refundState } from "@/lib/consultations";
import { useApiData } from "@/lib/use-api-data";
import type { RefundState } from "@/types/consultation-tables";

/** Outlined pill, matching the design. */
const refundPill: Record<RefundState, string> = {
  requested: "border-amber-300 text-amber-600",
  processing: "border-amber-300 text-amber-600",
  needs_review: "border-amber-300 text-amber-600",
  none: "border-slate-300 text-ink-muted",
  completed: "border-emerald-300 text-emerald-600",
  failed: "border-red-300 text-negative",
  "auto-processing": "border-amber-300 text-amber-600",
};

const refundLabel: Record<RefundState, string> = {
  requested: "Requested",
  processing: "Processing",
  needs_review: "Needs review",
  none: "No refund",
  completed: "Refunded",
  failed: "Failed",
  "auto-processing": "Processing",
};

/** One label/value pair; the right-hand column mirrors its alignment. */
interface Field {
  label: string;
  value: React.ReactNode;
}

export default function CancelledConsultationPage({
  params,
}: PageProps<"/consultations/cancelled/[id]">) {
  const { id } = use(params);
  const load = useMemo(() => () => fetchConsultation(id), [id]);
  const { data, loading, error, retry } = useApiData(load);

  if (loading || error || !data) {
    return (
      <>
        <Topbar title="Consultation Management" />
        <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
          <BackButton fallbackHref="/consultations/cancelled" />
          <ScreenState
            loading={loading}
            error={error}
            onRetry={retry}
            loadingLabel="Loading booking…"
          >
            <></>
          </ScreenState>
        </main>
      </>
    );
  }

  const call = {
    ...data,
    customerId: data.customerId ?? "—",
    lawyer: data.lawyer ?? "—",
    lawyerId: data.lawyerId ?? "—",
    cancelledAt: data.cancelledAt
      ? new Date(data.cancelledAt).toLocaleString()
      : "—",
    reason:
      data.reason ??
      (data.status === "no_lawyer" ? "No lawyer available" : "Cancelled"),
    refundStatus: refundState(data),
  };

  const reasonPill = (
    <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-ink">
      {call.reason}
    </span>
  );

  const cancellationRows: [Field, Field][] = [
    [
      { label: "Consultation ID", value: call.consultationId },
      { label: "Scheduled for", value: "Instant consultation" },
    ],
    [
      { label: "Cancelled at", value: call.cancelledAt },
      { label: "Reason", value: reasonPill },
    ],
  ];

  const participantRows: [Field, Field][] = [
    [
      { label: "Lawyer", value: call.lawyer },
      { label: "Lawyer ID", value: call.lawyerId },
    ],
    [
      { label: "Customers", value: call.customer },
      { label: "Customer ID", value: call.customerId },
    ],
  ];

  return (
    <>
      <Topbar title="Consultation Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <Card className="p-5">
          <BackButton
            fallbackHref="/consultations/cancelled"
            className="font-semibold text-ink"
          />

          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl leading-8 font-bold text-ink">
                {call.consultationId}
              </h1>
              <div className="mt-2">{reasonPill}</div>
            </div>

            {/* Only a failed refund is worth retrying. */}
            {call.refundStatus === "failed" ? (
              <PreviewAction
                title="Review refund retry"
                requireReason
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-surface px-4 py-2.5 text-sm font-medium text-negative transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
              >
                <RefreshCw className="size-4" aria-hidden />
                Retry Refund
              </PreviewAction>
            ) : null}
          </div>
        </Card>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">
              Cancellation Details
            </h2>

            <dl className="mt-5 space-y-5">
              {cancellationRows.map(([left, right]) => (
                <FieldRow key={left.label} left={left} right={right} />
              ))}

              {/* Refund status sits on its own, below the pairs. */}
              <div>
                <dt className="text-xs text-ink-subtle">Refund</dt>
                <dd className="mt-1.5">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${refundPill[call.refundStatus]}`}
                  >
                    {refundLabel[call.refundStatus]}
                  </span>
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Participants</h2>

            <dl className="mt-5 space-y-5">
              {participantRows.map(([left, right]) => (
                <FieldRow key={left.label} left={left} right={right} />
              ))}

              <div>
                <dt className="text-xs text-ink-subtle">City</dt>
                <dd className="mt-1.5 text-sm font-medium text-ink">Delhi</dd>
              </div>
            </dl>
          </Card>
        </div>
      </main>
    </>
  );
}

function FieldRow({ left, right }: { left: Field; right: Field }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <dt className="text-xs text-ink-subtle">{left.label}</dt>
        <dd className="mt-1.5 text-sm font-medium text-ink">{left.value}</dd>
      </div>

      {/* Right-hand pair is right-aligned, label included. */}
      <div className="min-w-0 text-right">
        <dt className="text-xs text-ink-subtle">{right.label}</dt>
        <dd className="mt-1.5 text-sm font-medium text-ink">{right.value}</dd>
      </div>
    </div>
  );
}
