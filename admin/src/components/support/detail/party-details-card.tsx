import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui";
import type { PartyDetails } from "@/types/ticket-detail";

/** Two-column label/value row, left label and right value. */
function Row({ left, right }: { left: [string, string]; right: [string, string] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="min-w-0">
        <p className="text-xs text-ink-muted">{left[0]}</p>
        <p className="mt-0.5 truncate text-sm text-ink">{left[1]}</p>
      </div>
      <div className="min-w-0 text-right">
        <p className="text-xs text-ink-muted">{right[0]}</p>
        <p className="mt-0.5 truncate text-sm text-ink">{right[1]}</p>
      </div>
    </div>
  );
}

export function PartyDetailsCard({
  title,
  party,
}: {
  title: string;
  party: PartyDetails;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>

      <div className="mt-4 space-y-3">
        <Row left={[party.idLabel, party.idValue]} right={["Name", party.name]} />
        <Row left={["Mobile No", party.mobile]} right={["Email", party.email]} />
        <Row left={["City", party.city]} right={["Last Active", party.lastActive]} />
      </div>

      <Link
        href={party.profileHref}
        className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-brand-soft px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        View full profile
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Card>
  );
}