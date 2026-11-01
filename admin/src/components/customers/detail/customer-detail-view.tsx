"use client";

import Link from "next/link";
import { customerLayoutPreview } from "@/data/customer-layout-preview";
import { useMemo, useState } from "react";
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
  if (id === "preview")
    return <Loaded customer={customerLayoutPreview} preview />;
  return <LiveCustomerDetail id={id} />;
}
function LiveCustomerDetail({ id }: { id: string }) {
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

function Loaded({
  customer,
  preview = false,
}: {
  customer: CustomerDetail;
  preview?: boolean;
}) {
  const [section, setSection] = useState("consultations");
  const sections = [
    {
      id: "consultations",
      label: "Consultations",
      count: customer.consultationTotal,
    },
    {
      id: "transactions",
      label: "Transactions",
      count: customer.transactions.length,
    },
    {
      id: "support",
      label: "Support tickets",
      count: customer.supportTickets.length,
    },
    { id: "refunds", label: "Refunds", count: customer.refunds.length },
  ];
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        <span>
          {preview
            ? "Layout preview · Fictional customer and sample records · No changes are saved"
            : "Customer profile"}
        </span>
        <Link
          className="font-medium text-brand hover:underline"
          href={preview ? "/customers" : "/customers/preview"}
        >
          {preview ? "Return to customers" : "View populated sample"}
        </Link>
      </div>
      <CustomerDetailHeader customer={customer} readOnly={preview} />
      <div className="grid items-start grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <PersonalInformationCard customer={customer} />
        <ReferralsCard referral={customer.referral} />
      </div>
      <section className="min-w-0 space-y-3" aria-label="Customer records">
        <div
          role="tablist"
          aria-label="Customer history"
          className="flex gap-1 overflow-x-auto border-b border-line"
        >
          {sections.map((item, index) => (
            <button
              key={item.id}
              id={`history-tab-${item.id}`}
              role="tab"
              aria-selected={section === item.id}
              aria-controls={`history-panel-${item.id}`}
              tabIndex={section === item.id ? 0 : -1}
              onClick={() => setSection(item.id)}
              onKeyDown={(event) => {
                if (
                  !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? sections.length - 1
                      : (index +
                          (event.key === "ArrowRight" ? 1 : -1) +
                          sections.length) %
                        sections.length;
                setSection(sections[next].id);
                document
                  .getElementById(`history-tab-${sections[next].id}`)
                  ?.focus();
              }}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${section === item.id ? "border-brand text-brand" : "border-transparent text-ink-muted hover:text-ink"}`}
            >
              {item.label}
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] tabular-nums">
                {item.count}
              </span>
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id={`history-panel-${section}`}
          aria-labelledby={`history-tab-${section}`}
          className="min-w-0"
          tabIndex={0}
        >
          {section === "consultations" && (
            <ConsultationHistoryCard
              rows={customer.consultations}
              total={customer.consultationTotal}
              preview={preview}
            />
          )}
          {section === "transactions" && (
            <TransactionHistoryCard rows={customer.transactions} />
          )}
          {section === "support" && (
            <SupportTicketsCard rows={customer.supportTickets} />
          )}
          {section === "refunds" && (
            <RefundHistoryCard rows={customer.refunds} />
          )}
        </div>
      </section>
      <ActivityTimeline events={customer.timeline} />
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
      recordId: row.id,
      lawyer: row.lawyer ?? "—",
      category: row.category ?? "—",
      type: "Consultation",
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
      recordId: row.id,
      type: row.type,
      amount: row.amount,
      method: row.method,
      date: asDay(row.date),
    })),
    refunds: record.refunds.map((row) => ({
      id: row.id.slice(0, 8),
      reason: row.reason,
      status: "processed",
      requestedOn: row.requestedOn ? asDay(row.requestedOn) : "Unknown",
    })),
    consultations,
    consultationTotal: record.consultationTotal,
  };
}
