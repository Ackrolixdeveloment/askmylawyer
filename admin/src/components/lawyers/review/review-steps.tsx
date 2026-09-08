"use client";

import {
  Building2,
  Download,
  Eye,
  FileText,
  Globe,
  Hash,
  Headphones,
  Mail,
  Phone,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui";
import type { LawyerApplication } from "@/types/lawyer";
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

export function PersonalInformationStep({
  application,
}: {
  application: LawyerApplication;
}) {
  const { personal } = application;
  return (
    // Personal details are signed off as a single block.
    <ReviewableBlock
      label="Personal Information"
      title="Personal Information"
    >
      <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
        <Field icon={User} label="Full Name">
          {personal.fullName}
        </Field>
        <Field icon={Mail} label="Email">
          {personal.email}
        </Field>
        <Field icon={Phone} label="Phone">
          {personal.phone}
        </Field>
        <Field icon={Globe} label="Languages">
          {personal.languages}
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
    // Aadhaar and PAN are verified independently, so each keeps its own control.
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {application.identity.documents.map((document) => (
        <ReviewableBlock
          key={document.label}
          label={document.label}
          title={document.label}
        >
          <div className="grid h-32 place-items-center rounded-lg bg-slate-100 text-ink-subtle">
            <FileText className="size-8" aria-hidden />
          </div>
          <p className="mt-3 truncate text-xs text-ink-muted">{document.fileName}</p>
          <DocumentActions />
        </ReviewableBlock>
      ))}
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
          {barCouncil.number}
        </Field>
        <Field icon={Building2} label="State Bar Council">
          {barCouncil.stateCouncil}
        </Field>
      </div>

      {/* Only the certificate is signed off here. */}
      <ReviewableBlock
        label="Certificate"
        title="Bar Council Certificate"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid size-20 shrink-0 place-items-center rounded-lg bg-slate-100 text-ink-subtle">
            <FileText className="size-7" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-ink">{barCouncil.certificateName}</p>
            <DocumentActions />
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
    <ReviewableBlock
      label="Professional Profile"
      title="Professional Profile"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
          <Field icon={User} label="Experience">
            {professional.experience}
          </Field>
          <Field icon={Headphones} label="Consultation type">
            {professional.consultationTypes.join("   ")}
          </Field>
        </div>

        <div>
          <p className="text-xs text-ink-muted">Practice Areas</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {professional.practiceAreas.map((area) => (
              <Badge key={area} tone="info">
                {area}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-ink-muted">Bio</p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            {professional.bio}
          </p>
        </div>
      </div>
    </ReviewableBlock>
  );
}

/** Preview / download pair shown under every uploaded document. */
function DocumentActions() {
  return (
    <div className="mt-2 flex flex-wrap gap-4">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <Eye className="size-3.5" aria-hidden />
        Click to Preview
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <Download className="size-3.5" aria-hidden />
        Download
      </button>
    </div>
  );
}
