"use client";

import { useMemo } from "react";
import { ScreenState } from "@/components/common/screen-state";
import { CancelledTable } from "@/components/consultations/cancelled-table";
import { ConsultationsTable } from "@/components/consultations/consultations-table";
import { InProgressTable } from "@/components/consultations/in-progress-table";
import { RefundedTable } from "@/components/consultations/refunded-table";
import {
  fetchConsultations,
  type ConsultationBucket,
  type ConsultationRow,
} from "@/lib/consultations";
import { useApiData } from "@/lib/use-api-data";
import {
  cancelledByOptions,
  consultationTypeOptions,
  refundStatusOptions,
  type CancelledConsultation,
  type LiveConsultation,
  type RefundedConsultation,
  type RefundState,
} from "@/types/consultation-tables";
import type { Consultation } from "@/types/consultation";

/** The tables' date helpers want a day, not a timestamp. */
const asDay = (iso: string) => iso.slice(0, 10);

/** "2026-10-21T09:03:34Z" -> "21 Oct, 12:33 pm". */
function asMoment(iso: string | null) {
  if (!iso) return "—";
  const at = new Date(iso);
  return `${at.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${at
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .toLowerCase()}`;
}

/** mm:ss of however long the two of them were actually in the call. */
function asClock(seconds: number) {
  const mins = Math.floor(seconds / 60);
  return `${mins}:${String(seconds % 60).padStart(2, "0")}`;
}

function sinceNow(iso: string | null) {
  if (!iso) return "not started";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  return `${mins} min ago`;
}

/** The shared half of every row. */
function base(row: ConsultationRow): Consultation {
  return {
    id: row.id,
    consultationId: row.consultationId,
    customer: row.customer,
    lawyer: row.lawyer ?? "—",
    // One plan today, and nothing is booked ahead, so these are fixed
    // rather than guessed per row.
    medium: "video",
    scheduled: false,
    duration: row.duration,
    date: asDay(row.date),
    fee: row.fee,
    status:
      row.status === "completed"
        ? "completed"
        : row.status === "cancelled" || row.status === "no_lawyer"
          ? "cancelled"
          : "in-progress",
  };
}

/** Refunds settle with the payment, so anything recorded is done. */
const refundState = (row: ConsultationRow): RefundState =>
  row.refundAmount > 0 ? "completed" : "auto-processing";

function useBucket(bucket: ConsultationBucket) {
  const load = useMemo(
    () => () => fetchConsultations(bucket, { perPage: 100 }),
    [bucket],
  );
  return useApiData(load);
}

export function CompletedConsultationsView() {
  const { data, loading, error, retry } = useBucket("completed");

  return (
    <ScreenState loading={loading} error={error} onRetry={retry} loadingLabel="Loading consultations…">
      <ConsultationsTable
        consultations={(data?.data ?? []).map(base)}
        typeOptions={consultationTypeOptions}
      />
    </ScreenState>
  );
}

export function InProgressConsultationsView() {
  const { data, loading, error, retry } = useBucket("in-progress");

  const rows: LiveConsultation[] = (data?.data ?? []).map((row) => ({
    ...base(row),
    customerId: row.customerId ?? "—",
    lawyerId: row.lawyerId ?? "—",
    startedAgo: sinceNow(row.startedAt),
    elapsed: asClock(row.talkedSeconds),
  }));

  return (
    <ScreenState loading={loading} error={error} onRetry={retry} loadingLabel="Loading live calls…">
      <InProgressTable consultations={rows} typeOptions={consultationTypeOptions} />
    </ScreenState>
  );
}

export function CancelledConsultationsView() {
  const { data, loading, error, retry } = useBucket("cancelled");

  const rows: CancelledConsultation[] = (data?.data ?? []).map((row) => ({
    ...base(row),
    status: "cancelled",
    customerId: row.customerId ?? "—",
    lawyerId: row.lawyerId ?? "—",
    cancelledAt: asMoment(row.cancelledAt),
    reason: row.reason ?? (row.status === "no_lawyer" ? "No lawyer available" : "Cancelled"),
    cancelledBy: row.cancelledBy === "lawyer" ? "lawyer" : "customer",
    refundStatus: refundState(row),
  }));

  return (
    <ScreenState loading={loading} error={error} onRetry={retry} loadingLabel="Loading cancellations…">
      <CancelledTable consultations={rows} cancelledByOptions={cancelledByOptions} />
    </ScreenState>
  );
}

export function RefundedConsultationsView() {
  const { data, loading, error, retry } = useBucket("refunded");

  const rows: RefundedConsultation[] = (data?.data ?? []).map((row) => ({
    ...base(row),
    status: "refunded",
    refundId: row.consultationId,
    customerId: row.customerId ?? "—",
    lawyerId: row.lawyerId ?? "—",
    refundedAt: asMoment(row.refundedAt),
    reason: row.reason ?? "Refunded",
    percent: row.refundPercent,
    refundAmount: row.refundAmount,
    refundStatus: refundState(row),
  }));

  return (
    <ScreenState loading={loading} error={error} onRetry={retry} loadingLabel="Loading refunds…">
      <RefundedTable consultations={rows} statusOptions={refundStatusOptions} />
    </ScreenState>
  );
}
