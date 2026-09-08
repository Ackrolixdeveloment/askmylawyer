import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Cell content that navigates to a record's view page.
 * A real anchor, so middle-click and "open in new tab" work.
 */
export function TableLink({
  href,
  className,
  children,
  ...rest
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link
      href={href}
      {...rest}
      className={cn(
        "rounded font-medium text-brand transition-colors hover:underline",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
        className,
      )}
    >
      {children}
    </Link>
  );
}
