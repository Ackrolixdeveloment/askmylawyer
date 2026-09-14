/** Shared chrome for the User Management list screens. */

export const solidAction =
  "inline-flex items-center gap-2 rounded-lg bg-sidebar-active px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sidebar-active/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none";

export const outlineAction =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none";

const tones = {
  brand: "text-brand hover:bg-blue-50",
  muted: "text-ink-muted hover:bg-slate-100",
  danger: "text-negative hover:bg-red-50",
} as const;

export function IconButton({
  label,
  tone,
  onClick,
  children,
}: {
  label: string;
  tone: keyof typeof tones;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`rounded-lg border border-line p-2 transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
