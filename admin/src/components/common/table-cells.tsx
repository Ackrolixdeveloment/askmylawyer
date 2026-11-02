import { Mail, Phone } from "lucide-react";

/** Consistent primary/secondary hierarchy for genuinely related fields. */
export function StackedCell({
  primary,
  secondary,
}: {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[13px] font-medium leading-5 text-ink">
        {primary}
      </div>
      {secondary && (
        <div className="mt-1 text-[11px] leading-4 text-ink-muted">
          {secondary}
        </div>
      )}
    </div>
  );
}
export function ContactCell({
  phone,
  email,
}: {
  phone?: string | null;
  email?: string | null;
}) {
  return (
    <div className="min-w-36 max-w-56 space-y-1.5 text-xs">
      {phone && (
        <a
          href={`tel:${phone.replace(/[^+\d]/g, "")}`}
          className="flex items-center gap-2 text-ink hover:text-brand"
        >
          <Phone className="size-3 shrink-0 text-ink-subtle" />
          <span className="whitespace-nowrap">{phone}</span>
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="flex min-w-0 items-center gap-2 text-ink-muted hover:text-brand"
        >
          <Mail className="size-3 shrink-0 text-ink-subtle" />
          <span className="truncate" title={email}>
            {email}
          </span>
        </a>
      )}
      {!phone && !email && (
        <span className="text-ink-subtle">Not provided</span>
      )}
    </div>
  );
}

/** Calendar date and time in IST, regardless of the admin browser timezone. */
export function DateTimeCell({ value }: { value: string | null }) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return <span className="text-ink-muted">Not recorded</span>;
  const date = new Date(value);
  return <div className="whitespace-nowrap"><div>{date.toLocaleDateString('en-IN', {timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric'})}</div><div className="mt-1 text-xs text-ink-muted">{date.toLocaleTimeString('en-IN', {timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'})} IST</div></div>;
}
