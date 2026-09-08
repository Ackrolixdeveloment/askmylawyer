import {
  AudioLines,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  ConsultationDetail,
  ConsultationDocument,
  PartySummary,
} from "@/types/consultation-detail";

function PartyCard({ role, party }: { role: string; party: PartySummary }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-ink-muted">{role}</p>

      <div className="mt-2 flex items-start gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"
          aria-hidden
        >
          <User className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{party.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
            <MapPin className="size-3" aria-hidden />
            {party.location}
          </p>
        </div>
      </div>

      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-ink-muted">
          <Phone className="size-3" aria-hidden />
          {party.phone}
        </div>
        <div className="flex items-center gap-1.5 text-brand">
          <Mail className="size-3" aria-hidden />
          {party.email}
        </div>
        <div className="text-ink-muted">
          {party.idLabel}: {party.idValue}
        </div>
      </dl>

      {party.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {party.tags.map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

export function PartiesSection({
  consultation,
}: {
  consultation: ConsultationDetail;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-ink">Customer &amp; lawyer</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PartyCard role="Customer" party={consultation.customer} />
        <PartyCard role="Lawyer" party={consultation.lawyer} />
      </div>
    </section>
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
      <div className="mt-1 text-sm text-ink">{children}</div>
    </div>
  );
}

export function ConsultationDetailsCard({
  consultation,
}: {
  consultation: ConsultationDetail;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Consultations details</h2>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
        <Pair label="Date">{consultation.date}</Pair>
        <Pair label="Consultation type" align="right">
          <div className="flex flex-wrap justify-end gap-2">
            <Badge tone="info">{consultation.medium} call</Badge>
            <Badge tone="neutral">{consultation.booking}</Badge>
          </div>
        </Pair>

        <Pair label="Start time">{consultation.startTime}</Pair>
        <Pair label="End time" align="right">
          {consultation.endTime}
        </Pair>

        <Pair label="Call ended">{consultation.callStatus}</Pair>
        <Pair label="Call duration" align="right">
          {consultation.duration}
        </Pair>

        <Pair label="Specialty">{consultation.specialty}</Pair>
        <Pair label="Sub category" align="right">
          <div className="flex flex-wrap justify-end gap-2">
            {consultation.subCategories.map((item) => (
              <Badge key={item} tone="info">
                {item}
              </Badge>
            ))}
          </div>
        </Pair>

        <Pair label="Fee charged">
          <span className="font-medium text-positive">
            {formatInr(consultation.fee)}
          </span>
        </Pair>
      </div>
    </Card>
  );
}

export function AudioPlaybackCard({ audioUrl }: { audioUrl: string | null }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Audio playback</h2>
        <span className="text-xs text-ink-subtle">Admin access only</span>
      </div>

      <div className="mt-4 rounded-xl bg-ink p-4 text-white">
        {audioUrl ? (
          <audio controls src={audioUrl} className="w-full" />
        ) : (
          <div className="flex items-center gap-3">
            <AudioLines className="size-5 shrink-0 text-white/60" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium">Recording not available</p>
              <p className="mt-0.5 text-xs text-white/60">
                Audio is retained for 90 days after the consultation, then deleted.
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-ink-subtle">
        Audio is never exposed to the customer or the lawyer — admin access is
        logged.
      </p>
    </Card>
  );
}

export function DocumentsCard({
  documents,
}: {
  documents: ConsultationDocument[];
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Documents</h2>
        <span className="text-xs text-ink-muted">
          {documents.length} reports
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {documents.map((document) => (
          <li
            key={document.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3"
          >
            <FileText className="size-5 shrink-0 text-ink-subtle" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink">{document.name}</p>
              <p className="mt-0.5 truncate text-xs text-ink-subtle">
                {document.meta}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-ink-muted transition-colors hover:bg-slate-50 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <Download className="size-3.5" aria-hidden />
              View
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
