import type { Metadata } from "next";
import { RefreshCw } from "lucide-react";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { BackButton, Card } from "@/components/ui";
import type { RefundState } from "@/data/mock-consultations";
import { cancelledConsultations } from "@/data/mock-consultations";

export const metadata: Metadata = {
  title: "Cancelled Consultation",
};

/** Outlined pill, matching the design. */
const refundPill: Record<RefundState, string> = {
  completed: "border-emerald-300 text-emerald-600",
  failed: "border-red-300 text-negative",
  "auto-processing": "border-amber-300 text-amber-600",
};

const refundLabel: Record<RefundState, string> = {
  completed: "Refunded",
  failed: "Failed",
  "auto-processing": "Processing",
};

/** One label/value pair; the right-hand column mirrors its alignment. */
interface Field {
  label: string;
  value: React.ReactNode;
}

export default async function CancelledConsultationPage({
  params,
}: PageProps<"/consultations/cancelled/[id]">) {
  const { id } = await params;
  const call = cancelledConsultations.find((row) => row.id === id);

  if (!call) notFound();

  const reasonPill = (
    <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-ink">
      {call.reason}
    </span>
  );

  const cancellationRows: [Field, Field][] = [
    [
      { label: "Consultation ID", value: call.consultationId },
      { label: "Scheduled for", value: "Today 10:00 AM" },
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
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-surface px-4 py-2.5 text-sm font-medium text-negative transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
              >
                <RefreshCw className="size-4" aria-hidden />
                Retry Refund
              </button>
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
