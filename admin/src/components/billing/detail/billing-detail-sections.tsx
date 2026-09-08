import { ArrowRight, Check, Download } from "lucide-react";
import Link from "next/link";
import { Badge, Card, type BadgeTone } from "@/components/ui";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BillingDetail, BillingParty, BillingStatus } from "@/types/billing";

const statusTone: Record<BillingStatus, BadgeTone> = {
  paid: "success",
  pending: "refunded",
  refunded: "info",
  failed: "danger",
};

const statusLabel: Record<BillingStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  refunded: "Refunded",
  failed: "Failed",
};

export function BillingDetailHeader({
  record,
  editable,
}: {
  record: BillingDetail;
  /** Read-only view hides the payout actions. */
  editable: boolean;
}) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold text-ink">{record.title}</h1>
        <Badge tone={statusTone[record.status]} className="mt-2">
          {statusLabel[record.status]}
        </Badge>
      </div>

      {editable ? (
        <div className="flex flex-wrap gap-2">
          {/* TODO: wire both actions to the payouts API. */}
          <button
            type="button"
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-warn transition-colors hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            resubmission
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <Check className="size-4" aria-hidden />
            Approve payout
          </button>
        </div>
      ) : null}
    </Card>
  );
}

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
      <div className="mt-1 text-sm font-medium text-ink">{children}</div>
    </div>
  );
}

export function ConsultationDetailsCard({ record }: { record: BillingDetail }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Consultations details</h2>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
        <Pair label="Booking ID">{record.bookingId}</Pair>
        <Pair label="Date & Time" align="right">
          {record.dateTime}
        </Pair>

        <Pair label="Speciality">{record.speciality}</Pair>
        <Pair label="Duration" align="right">
          {record.duration}
        </Pair>

        <Pair label="Consultation Type">
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">{record.medium}</Badge>
            <Badge tone="neutral">{record.booking}</Badge>
          </div>
        </Pair>
        <Pair label="Status" align="right">
          <div className="flex justify-end">
            <Badge tone="success">{record.consultationStatus}</Badge>
          </div>
        </Pair>
      </div>
    </Card>
  );
}

export function PaymentBreakdownCard({ record }: { record: BillingDetail }) {
  const { breakdown } = record;

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Payment Breakdown</h2>

      <dl className="mt-4 space-y-3">
        <Row label="Customer Paid" amount={breakdown.customerPaid} />
        <Row label="Coupon discount" amount={-breakdown.couponDiscount} />
        <Row
          label={`Platform cut (${breakdown.platformCutPercent}%)`}
          amount={-breakdown.platformCut}
        />

        <div className="flex items-center justify-between gap-4 border-t border-line pt-3">
          <dt className="text-sm font-medium text-ink">Net to lawyer</dt>
          <dd className="text-sm font-semibold text-ink">
            {formatInr(breakdown.netToLawyer)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function Row({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-sm font-medium text-ink">{formatInr(amount)}</dd>
    </div>
  );
}

function PartyRow({ party }: { party: BillingParty }) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-0">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand"
        aria-hidden
      >
        {party.initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{party.name}</p>
        <p className="text-xs text-ink-muted">{party.role}</p>
      </div>
      <Link
        href={party.profileHref}
        className="inline-flex shrink-0 items-center gap-1.5 rounded text-sm font-medium text-ink transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        View
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

export function PartiesCard({ record }: { record: BillingDetail }) {
  return (
    <Card className="px-5 py-2">
      <PartyRow party={record.lawyer} />
      <PartyRow party={record.customer} />
    </Card>
  );
}

export function InvoicePreviewCard({ record }: { record: BillingDetail }) {
  const { invoice } = record;

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Invoice Preview</h2>

      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        <div className="bg-ink px-4 py-3 text-white">
          <p className="text-sm font-semibold">Ask My Lawyer</p>
          <p className="mt-0.5 text-[11px] text-white/70">
            GST : {invoice.gstin} . {invoice.supportEmail}
          </p>
        </div>

        <div className="p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-ink">{invoice.number}</p>
            <p className="text-xs text-ink-subtle">{invoice.date}</p>
          </div>

          <dl className="mt-3 space-y-2">
            {invoice.lines.map((line) => (
              <div
                key={line.label}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <dt className="text-ink-muted">{line.label}</dt>
                <dd
                  className={cn(
                    "font-medium",
                    line.negative ? "text-negative" : "text-ink",
                  )}
                >
                  {line.negative ? "-" : ""}
                  {formatInr(line.amount)}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-emerald-50 px-3 py-2.5">
            <p className="text-sm text-ink">Total charged</p>
            <p className="text-base font-bold text-positive">
              {formatInr(invoice.total)}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm text-ink-muted transition-colors hover:bg-slate-50 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <Download className="size-4" aria-hidden />
        Download pdf
      </button>
    </Card>
  );
}
