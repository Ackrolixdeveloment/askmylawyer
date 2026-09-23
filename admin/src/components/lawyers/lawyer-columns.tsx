import { Mail, Phone } from "lucide-react";
import { TableLink, type Column } from "@/components/ui";

/** How any Lawyer Management row describes the lawyer it belongs to. */
export interface LawyerIdentity {
  /** Short code, e.g. "LAW-3059057B". */
  lawyerId: string;
  name: string;
  mobile: string;
  email: string;
  /** Where the name links, when the row opens a profile. */
  href?: string;
}

/**
 * The two columns every Lawyer Management table starts with, so a lawyer
 * reads the same way wherever they turn up.
 */
export function lawyerIdColumn<T>(identity: (row: T) => LawyerIdentity): Column<T> {
  return {
    key: "lawyerId",
    header: "LAWYER ID",
    align: "left",
    sortValue: (row) => identity(row).lawyerId,
    cell: (row) => (
      <span className="font-semibold text-ink">{identity(row).lawyerId}</span>
    ),
  };
}

export function lawyerDetailsColumn<T>(
  identity: (row: T) => LawyerIdentity,
): Column<T> {
  return {
    key: "lawyer",
    header: "LAWYER DETAILS",
    align: "left",
    sortValue: (row) => identity(row).name,
    cell: (row) => {
      const { name, mobile, email, href } = identity(row);
      const label = name || "Name not filled in";

      return (
        <div className="min-w-48">
          {href ? (
            <TableLink href={href} className="font-semibold text-ink hover:text-brand">
              {label}
            </TableLink>
          ) : (
            <p className="font-semibold text-ink">{label}</p>
          )}

          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
            <Phone className="size-3 shrink-0" aria-hidden />
            {mobile || "-"}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-brand">
            <Mail className="size-3 shrink-0" aria-hidden />
            {email || "-"}
          </p>
        </div>
      );
    },
  };
}
