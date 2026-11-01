"use client";

import Link from "next/link";
import { use, useMemo } from "react";
import { ScreenState } from "@/components/common/screen-state";
import { Topbar } from "@/components/layout/topbar";
import { BackButton, Card } from "@/components/ui";
import { fetchConsultation, refundState } from "@/lib/consultations";
import { useApiData } from "@/lib/use-api-data";
import type { RefundState } from "@/types/consultation-tables";
import { formatInr } from "@/lib/format";

/** Outlined pill, matching the design. */
const statusPill: Record<RefundState, string> = {
  requested: "border-amber-300 text-amber-600",
  processing: "border-amber-300 text-amber-600",
  needs_review: "border-amber-300 text-amber-600",
  none: "border-slate-300 text-ink-muted",
  completed: "border-emerald-300 text-emerald-600",
  failed: "border-red-300 text-negative",
  "auto-processing": "border-amber-300 text-amber-600",
};

const statusLabel: Record<RefundState, string> = {
  requested: "Requested",
  processing: "Processing",
  needs_review: "Needs review",
  none: "No refund",
  completed: "Completed",
  failed: "Failed",
  "auto-processing": "Processing",
};

/** One label/value pair; the right-hand column mirrors its alignment. */
interface Field {
  label: string;
  value: React.ReactNode;
}

export default function RefundDetailPage({
  params,
}: PageProps<"/consultations/refunded/[id]">) {
  const { id } = use(params);
  const load = useMemo(() => () => fetchConsultation(id), [id]);
  const { data, loading, error, retry } = useApiData(load);

  if (loading || error || !data) {
    return (
      <>
        <Topbar title="Consultation Management" />
        <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
          <BackButton fallbackHref="/consultations/refunded" />
          <ScreenState
            loading={loading}
            error={error}
            onRetry={retry}
            loadingLabel="Loading refund…"
          >
            <></>
          </ScreenState>
        </main>
      </>
    );
  }

  const refund = {
    ...data,
    refundId: data.consultationId,
    percent: data.refundPercent,
    reason: data.reason ?? "Refunded",
    refundedAt: data.refundedAt
      ? new Date(data.refundedAt).toLocaleString()
      : "—",
    refundStatus: refundState(data),
  };

  const refundRows: [Field, Field][] = [
    [
      { label: "Consultation", value: refund.consultationId },
      {
        label: "Amount",
        value: formatInr(refund.refundAmount),
      },
    ],
    [
      { label: "Completed at", value: refund.refundedAt },
      { label: "Destination", value: "Original Payment" },
    ],
    [
      {
        label: "Reason",
        value: (
          <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-ink">
            {refund.reason}
          </span>
        ),
      },
      {
        label: "Status",
        value: (
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusPill[refund.refundStatus]}`}
          >
            {statusLabel[refund.refundStatus]}
          </span>
        ),
      },
    ],
  ];

  const paymentRows: [Field, Field][] = [
    [
      { label: "Customer", value: data.customer },
      { label: "Payment ID", value: data.paymentId ?? "—" },
    ],
    [
      { label: "Consultation", value: data.consultationId },
      { label: "Payment Method", value: data.paymentMethod ?? "—" },
    ],
    [
      {
        label: "Payment Date",
        value: data.paidAt ? new Date(data.paidAt).toLocaleString() : "—",
      },
      { label: "Amount", value: formatInr(refund.fee) },
    ],
  ];

  return (
    <>
      <Topbar title="Consultation Management" />

      <main className="min-w-0 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <Card className="p-5">
          <BackButton
            fallbackHref="/consultations/refunded"
            className="font-semibold text-ink"
          />

          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl leading-8 font-bold text-ink">
                {refund.refundId}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink-subtle">
                  {formatInr(refund.fee)}
                </span>
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-ink">
                  {refund.reason}
                </span>
              </div>
            </div>

            <Link
              href={`/consultations/${id}`}
              className="inline-flex items-center rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              View Consultation
            </Link>
          </div>
        </Card>

        {refund.refundStatus !== "completed" ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No completed gateway refund is confirmed. Requested amounts must be
            reconciled before money is marked returned.
          </p>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <DetailCard title="Refund details" rows={refundRows} />
          <DetailCard title="Payment & Customer" rows={paymentRows} />
        </div>
      </main>
    </>
  );
}

function DetailCard({
  title,
  rows,
}: {
  title: string;
  rows: [Field, Field][];
}) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>

      <dl className="mt-5 space-y-5">
        {rows.map(([left, right]) => (
          <div
            key={left.label}
            className="flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <dt className="text-xs text-ink-subtle">{left.label}</dt>
              <dd className="mt-1.5 text-sm font-medium text-ink">
                {left.value}
              </dd>
            </div>

            {/* Right-hand pair is right-aligned, label included. */}
            <div className="min-w-0 text-right">
              <dt className="text-xs text-ink-subtle">{right.label}</dt>
              <dd className="mt-1.5 text-sm font-medium text-ink">
                {right.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </Card>
  );
}
