"use client";

import { useMemo } from "react";
import { ScreenState } from "@/components/common/screen-state";
import { ActivityTimeline } from "@/components/customers/detail/activity-timeline";
import { CustomerDetailHeader } from "@/components/customers/detail/customer-detail-header";
import {
  ConsultationHistoryCard,
  RefundHistoryCard,
  SupportTicketsCard,
  TransactionHistoryCard,
} from "@/components/customers/detail/history-cards";
import { PersonalInformationCard } from "@/components/customers/detail/personal-information-card";
import { ReferralsCard } from "@/components/customers/detail/referrals-card";
import { fetchCustomer, type CustomerRecord } from "@/lib/customers";
import { useApiData } from "@/lib/use-api-data";
import type {
  ConsultationHistoryRow,
  CustomerDetail,
  TimelineEvent,
} from "@/types/customer";

export function CustomerDetailView({ id }: { id: string }) {
  const load = useMemo(() => () => fetchCustomer(id), [id]);
  const { data, loading, error, retry } = useApiData(load);

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading customer…"
    >
      {data ? <Loaded customer={toDetail(data)} /> : null}
    </ScreenState>
  );
}

function Loaded({ customer }: { customer: CustomerDetail }) {
  return (
    <>
      <CustomerDetailHeader customer={customer} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <PersonalInformationCard customer={customer} />
          <TransactionHistoryCard rows={customer.transactions} />
          <SupportTicketsCard rows={customer.supportTickets} />
          <RefundHistoryCard rows={customer.refunds} />
        </div>

        <div className="space-y-4">
          <ReferralsCard referral={customer.referral} />
          <ActivityTimeline events={customer.timeline} />
        </div>
      </div>

      <ConsultationHistoryCard
        rows={customer.consultations}
        total={customer.consultationTotal}
      />
    </>
  );
}

/**
 * "2026-10-21T09:03:34.083Z" -> "2026-10-21". The cards' date helpers split
 * on "-", so a full timestamp parses as an invalid date.
 */
const asDay = (iso: string) => iso.slice(0, 10);

/** Maps the API record onto the shape the existing cards already render. */
function toDetail(record: CustomerRecord): CustomerDetail {
  const p = record.personal;
  const joined = new Date(record.joinedOn);

  const consultations: ConsultationHistoryRow[] = record.consultations.map(
    (row) => ({
      id: row.reference || row.id.slice(0, 8),
      lawyer: row.lawyer ?? "—",
      category: row.category ?? "—",
      type: "Video",
      date: asDay(row.date),
      status:
        row.status === "completed"
          ? "completed"
          : row.status === "cancelled" || row.status === "no_lawyer"
            ? "cancelled"
            : "ongoing",
      amount: row.amount,
      refunded: row.refunded,
    }),
  );

  // Built from what actually happened, newest last, rather than a fixed
  // list of milestones.
  const timeline: TimelineEvent[] = [
    {
      id: "created",
      title: "Account created",
      detail: p.mobile ? "Mobile number" : "Email address",
      timestamp: joined.toLocaleString(),
      done: true,
    },
    ...record.consultations.slice(0, 5).map((row) => ({
      id: row.id,
      title: `Consultation ${row.status}`,
      detail: row.lawyer ? `with ${row.lawyer}` : undefined,
      timestamp: new Date(row.date).toLocaleString(),
      done: true,
    })),
  ];

  return {
    id: record.id,
    code: record.id.slice(0, 8).toUpperCase(),
    name: record.name,
    status: record.status,
    city: record.city,
    personal: {
      fullName: p.fullName ?? "—",
      email: p.email,
      mobile: p.mobile ?? "—",
      gender: p.gender ?? "—",
      age: p.ageBand ?? "—",
      languages: p.languages.length > 0 ? p.languages.join(", ") : "—",
      speciality: "—",
      cityState: [p.city, p.state].filter(Boolean).join(" , ") || "—",
      address: p.address ?? "—",
    },
    // Neither module is built yet, so these stay empty rather than invented.
    referral: null,
    supportTickets: [],
    timeline,
    transactions: record.transactions.map((row) => ({
      id: row.reference || row.id.slice(0, 8),
      type: row.type,
      amount: row.amount,
      method: row.method,
      date: asDay(row.date),
    })),
    refunds: record.refunds.map((row) => ({
      id: row.id.slice(0, 8),
      reason: row.reason,
      status: "processed",
      requestedOn: asDay(row.requestedOn),
    })),
    consultations,
    consultationTotal: record.consultationTotal,
  };
}
