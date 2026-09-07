import { BadgeCheck, Briefcase, MapPin } from "lucide-react";
import { Badge } from "@/components/ui";
import type { LawyerApplication, StepStatus } from "@/types/lawyer";

const overallTone = {
  approved: "success",
  rejected: "danger",
  pending: "refunded",
} as const;

const overallLabel = {
  approved: "Approved",
  rejected: "Rejected",
  pending: "Pending",
} as const;

interface ApplicationHeaderProps {
  application: LawyerApplication;
  /** Derived from the step statuses below it. */
  overall: keyof typeof overallTone;
}

export function ApplicationHeader({ application, overall }: ApplicationHeaderProps) {
  const initials = application.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl bg-brand-soft p-5">
      <div className="flex min-w-0 items-center gap-4">
        <span
          className="grid size-16 shrink-0 place-items-center rounded-full bg-brand/15 text-lg font-semibold text-brand"
          aria-hidden
        >
          {initials}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold text-ink">{application.name}</h1>
            <Badge tone={overallTone[overall]}>{overallLabel[overall]}</Badge>
          </div>

          <p className="mt-0.5 text-sm text-ink-muted">{application.title}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="size-3.5" aria-hidden />
              {application.experienceYears} Years
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden />
              {application.location}
            </span>
          </div>
        </div>
      </div>

      {application.digilockerVerified ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
          <BadgeCheck className="size-4" aria-hidden />
          DigiLocker Verified
        </span>
      ) : null}
    </div>
  );
}

/** Rolls the four step statuses up into the header badge. */
export function overallStatus(
  statuses: StepStatus[],
): keyof typeof overallTone {
  if (statuses.includes("rejected")) return "rejected";
  if (statuses.every((status) => status === "approved")) return "approved";
  return "pending";
}