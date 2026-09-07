import { Card } from "@/components/ui";
import type { CustomerDetail } from "@/types/customer";

/** Label on the left, value right-aligned — a two-column definition row. */
function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="text-right text-sm text-ink">{value ?? "-"}</p>
    </div>
  );
}

export function PersonalInformationCard({
  customer,
}: {
  customer: CustomerDetail;
}) {
  const { personal } = customer;

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Personal Informations</h2>

      <div className="mt-3 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
        <Row label="Full Name" value={personal.fullName} />
        <Row label="Email" value={personal.email} />
        <Row label="Mobile" value={personal.mobile} />
        <Row label="Gender" value={personal.gender} />
        <Row label="Age" value={personal.age} />
        <Row label="Languages" value={personal.languages} />
        <Row label="Speciality" value={personal.speciality} />
        <Row label="City" value={personal.cityState} />
      </div>

      <div className="mt-2 border-t border-line pt-3">
        <p className="text-xs text-ink-muted">Complete Address</p>
        <p className="mt-1.5 text-sm text-ink">{personal.address}</p>
      </div>
    </Card>
  );
}