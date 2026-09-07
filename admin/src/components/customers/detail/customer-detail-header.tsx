import { Ban, MapPin, SquarePen } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import type { CustomerDetail } from "@/types/customer";

export function CustomerDetailHeader({
  customer,
}: {
  customer: CustomerDetail;
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
            <h1 className="truncate text-xl font-bold text-ink">{customer.name}</h1>
            <Badge tone={customer.status === "active" ? "success" : "danger"}>
              {customer.status === "active" ? "Active" : "Suspended"}
            </Badge>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
            <span>{customer.code}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {customer.city}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="px-3 py-2 text-sm">
          <SquarePen className="size-4" aria-hidden />
          Edit
        </Button>
        <Button
          variant="outline"
          className="border-red-200 px-3 py-2 text-sm text-negative hover:bg-red-50"
        >
          <Ban className="size-4" aria-hidden />
          Suspend
        </Button>
      </div>
    </Card>
  );
}