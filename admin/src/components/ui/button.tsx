import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-ink text-white hover:bg-ink/90",
  ghost: "text-ink-muted hover:bg-slate-100",
  outline: "border border-line bg-surface text-ink hover:bg-slate-50",
} as const;

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ComponentProps<"button"> & { variant?: keyof typeof variants }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
