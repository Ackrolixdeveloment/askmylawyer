import { PreviewAction } from "@/components/ui/preview-action";
import { Ban, MapPin } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { CustomerDetail } from "@/types/customer";

export function CustomerDetailHeader({
  customer,
  readOnly = false,
}: {
  customer: CustomerDetail;
  readOnly?: boolean;
}) {
  const initials = customer.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="flex min-w-0 items-center gap-4">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-soft text-base font-semibold text-brand"
          aria-hidden
        >
          {initials}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold text-ink">
              {customer.name}
            </h1>
            <Badge tone={customer.status === "active" ? "success" : "danger"}>
              {customer.status === "active" ? "Active" : "Suspended"}
            </Badge>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
            <span>{customer.code}</span>
            {customer.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                {customer.city}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Edit is hidden until the form behind it is built. */}
        {!readOnly && (
          <PreviewAction
            title={`Review suspension · ${customer.name}`}
            requireReason
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs text-negative hover:bg-red-50"
          >
            <Ban className="size-4" aria-hidden />
            Suspend
          </PreviewAction>
        )}
      </div>
    </Card>
  );
}
