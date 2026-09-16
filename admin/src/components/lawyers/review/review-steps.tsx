"use client";

import {
  Building2,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Globe,
  Hash,
  Headphones,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui";
import { documentUrl } from "@/lib/lawyers";
import type { ApplicationDocument, LawyerApplication } from "@/types/lawyer";
import { ReviewableBlock } from "./reviewable-block";

/** Plain label + value pair. */
function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </p>
      <p className="mt-1.5 text-sm text-ink">{children}</p>
    </div>
  );
}

/** Chip list, or a dash when the lawyer left the section empty. */
function Chips({ values, tone = "info" }: { values: string[]; tone?: "info" | "neutral" }) {
  if (values.length === 0) {
    return <span className="text-sm text-ink-subtle">-</span>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} tone={tone}>
          {value}
        </Badge>
      ))}
    </div>
  );
}

export function PersonalInformationStep({
  application,
}: {
  application: LawyerApplication;
}) {
  const { personal } = application;
  return (
    // Personal details are signed off as a single block.
    <ReviewableBlock label="Personal Information" title="Personal Information">
      <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
        <Field icon={User} label="Full Name">
          {personal.fullName || "-"}
        </Field>
        <Field icon={Mail} label="Email">
          {personal.email || "-"}
        </Field>
        <Field icon={Phone} label="Phone">
          {personal.phone || "-"}
        </Field>
        <Field icon={Globe} label="Languages">
          {personal.languages || "-"}
        </Field>
      </div>
    </ReviewableBlock>
  );
}

export function IdentityVerificationStep({
  application,
}: {
  application: LawyerApplication;
}) {
  return (
    <div className="space-y-4">
      {/* Aadhaar and PAN are verified independently, so each keeps its own control. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {application.identity.documents.map((document) => (
          <ReviewableBlock
            key={document.label}
            label={document.label}
            title={document.label}
          >
            <DocumentPreview lawyerId={application.id} document={document} />
            <p className="mt-3 text-sm font-medium text-ink">
              {document.number || "Number not provided"}
            </p>
            <p className="truncate text-xs text-ink-muted">
              {document.fileName || "Not uploaded"}
            </p>
            <DocumentActions lawyerId={application.id} document={document} />
          </ReviewableBlock>
        ))}
      </div>

      <Field icon={MapPin} label="Residential Address">
        {application.identity.address || "-"}
      </Field>
    </div>
  );
}

export function BarCouncilVerificationStep({
  application,
}: {
  application: LawyerApplication;
}) {
  const { barCouncil } = application;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
        <Field icon={Hash} label="Bar Council Number">
          {barCouncil.number || "-"}
        </Field>
        <Field icon={Building2} label="State Bar Council">
          {barCouncil.stateCouncil || "-"}
        </Field>
        <Field icon={GraduationCap} label="Qualification">
          {barCouncil.qualification || "-"}
        </Field>
      </div>

      {/* Only the certificate is signed off here. */}
      <ReviewableBlock label="Certificate" title="Bar Council Certificate">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid size-20 shrink-0 place-items-center rounded-lg bg-slate-100 text-ink-subtle">
            <FileText className="size-7" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-ink">
              {barCouncil.certificate?.fileName ?? "Not uploaded"}
            </p>
            <DocumentActions
              lawyerId={application.id}
              document={barCouncil.certificate}
            />
          </div>
        </div>
      </ReviewableBlock>
    </div>
  );
}

export function ProfessionalProfileStep({
  application,
}: {
  application: LawyerApplication;
}) {
  const { professional } = application;
  return (
    // The profile is signed off as a whole.
    <ReviewableBlock label="Professional Profile" title="Professional Profile">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
          <Field icon={User} label="Experience">
            {professional.experience || "-"}
          </Field>
          <Field icon={Headphones} label="Consultation type">
            {professional.consultationTypes.join("   ") || "-"}
          </Field>
        </div>

        <div>
          <p className="text-xs text-ink-muted">Practice Areas</p>
          <div className="mt-2">
            <Chips values={professional.practiceAreas} />
          </div>
        </div>

        <div>
          <p className="text-xs text-ink-muted">Case Categories</p>
          <div className="mt-2">
            <Chips values={professional.caseCategories} tone="neutral" />
          </div>
        </div>

        <div>
          <p className="text-xs text-ink-muted">Bio</p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            {professional.bio || "-"}
          </p>
        </div>

        {professional.photo || professional.signature ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {professional.photo ? (
              <div>
                <p className="mb-2 text-xs text-ink-muted">Profile Photo</p>
                <DocumentPreview
                  lawyerId={application.id}
                  document={professional.photo}
                />
                <DocumentActions
                  lawyerId={application.id}
                  document={professional.photo}
                />
              </div>
            ) : null}
            {professional.signature ? (
              <div>
                <p className="mb-2 text-xs text-ink-muted">Signature</p>
                <DocumentPreview
                  lawyerId={application.id}
                  document={professional.signature}
                />
                <DocumentActions
                  lawyerId={application.id}
                  document={professional.signature}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </ReviewableBlock>
  );
}

/** Shows the uploaded image itself; other file types fall back to an icon. */
function DocumentPreview({
  lawyerId,
  document,
}: {
  lawyerId: string;
  document: ApplicationDocument;
}) {
  if (!document.fileName) {
    return (
      <div className="grid h-32 place-items-center rounded-lg bg-slate-100 text-xs text-ink-subtle">
        Not uploaded
      </div>
    );
  }

  if (document.mimeType.startsWith("image/")) {
    return (
      // A plain img: the file is served by the admin API, not the image CDN.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={documentUrl(lawyerId, document.type)}
        alt={document.fileName}
        className="h-32 w-full rounded-lg bg-slate-100 object-contain"
      />
    );
  }

  return (
    <div className="grid h-32 place-items-center rounded-lg bg-slate-100 text-ink-subtle">
      <FileText className="size-8" aria-hidden />
    </div>
  );
}

/** Preview / download pair shown under every uploaded document. */
function DocumentActions({
  lawyerId,
  document,
}: {
  lawyerId: string;
  document: ApplicationDocument | null;
}) {
  if (!document?.fileName) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-4">
      <a
        href={documentUrl(lawyerId, document.type)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <Eye className="size-3.5" aria-hidden />
        Click to Preview
      </a>
      <a
        href={documentUrl(lawyerId, document.type, true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <Download className="size-3.5" aria-hidden />
        Download
      </a>
    </div>
  );
}
