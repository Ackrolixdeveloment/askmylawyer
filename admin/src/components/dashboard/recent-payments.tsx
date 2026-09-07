import { Badge, Card, type BadgeTone } from "@/components/ui";
import { formatInr } from "@/lib/format";
import type { PaymentRow, PaymentStatus } from "@/types/dashboard";

const statusTone: Record<PaymentStatus, BadgeTone> = {
  success: "success",
  refunded: "refunded",
  pending: "info",
  failed: "danger",
};

const statusLabel: Record<PaymentStatus, string> = {
  success: "Success",
  refunded: "Refunded",
  pending: "Pending",
  failed: "Failed",
};

export function RecentPayments({ payments }: { payments: PaymentRow[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Recent Payments</h2>
      <p className="mt-0.5 text-sm text-ink-muted">Latest transaction</p>

      <ul className="mt-4 space-y-4">
        {payments.map((payment) => (
          <li key={payment.id} className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {payment.customer}
              </p>
              <p className="truncate text-sm text-ink-subtle">{payment.lawyer}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-ink">
                {formatInr(payment.amount)}
              </p>
              <Badge tone={statusTone[payment.status]} className="mt-1">
                {statusLabel[payment.status]}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
