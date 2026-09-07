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

/** Label + value pair used across every step panel. */
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
    <div>
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
    <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
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
  );
}

export function IdentityVerificationStep({
  application,
}: {
  application: LawyerApplication;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {application.identity.documents.map((document) => (
        <div key={document.label} className="rounded-xl border border-line p-4">
          <p className="text-sm font-medium text-ink">{document.label}</p>
          <div className="mt-3 grid h-32 place-items-center rounded-lg bg-slate-100 text-ink-subtle">
            <FileText className="size-8" aria-hidden />
          </div>
          <p className="mt-3 truncate text-xs text-ink-muted">{document.fileName}</p>
          <DocumentActions />
        </div>
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
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        <Field icon={Hash} label="Bar Council Number">
          {barCouncil.number}
        </Field>
        <Field icon={Building2} label="State Bar Council">
          {barCouncil.stateCouncil}
        </Field>
      </div>

      <div>
        <p className="text-xs text-ink-muted">Certificate</p>
        <div className="mt-2 flex flex-wrap items-center gap-4 rounded-xl border border-line p-4">
          <div className="grid size-20 shrink-0 place-items-center rounded-lg bg-slate-100 text-ink-subtle">
            <FileText className="size-7" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-ink">{barCouncil.certificateName}</p>
            <DocumentActions />
          </div>
        </div>
      </div>
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
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
        <p className="mt-2 text-sm leading-relaxed text-ink">{professional.bio}</p>
      </div>
    </div>
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
        Preview Certificate
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