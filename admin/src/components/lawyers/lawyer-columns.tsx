import { type Column } from "@/components/ui";
import { PersonCell } from "@/components/common/person-cell";
import { ContactCell, StackedCell } from "@/components/common/table-cells";
export interface LawyerIdentity {
  lawyerId: string;
  name: string;
  mobile: string;
  email: string;
  href?: string;
}
export function lawyerIdentityColumn<T>(
  identity: (row: T) => LawyerIdentity,
): Column<T> {
  return {
    key: "name",
    header: "Lawyer / ID",
    align: "left",
    sortValue: (r) => identity(r).name,
    textValue: (r) => `${identity(r).name} ${identity(r).lawyerId}`,
    cell: (r) => {
      const p = identity(r);
      return (
        <PersonCell
          showInitials={false}
          name={p.name || "Name not provided"}
          detail={p.lawyerId}
          href={p.href}
        />
      );
    },
  };
}
export function lawyerContactColumn<T>(
  identity: (row: T) => LawyerIdentity,
): Column<T> {
  return {
    key: "contact",
    header: "Contact",
    align: "left",
    sortValue: (r) => identity(r).mobile || identity(r).email,
    textValue: (r) => `${identity(r).mobile} ${identity(r).email}`,
    cell: (r) => (
      <ContactCell phone={identity(r).mobile} email={identity(r).email} />
    ),
  };
}
export function lawyerBarColumn<
  T extends {
    barId: string;
    barCouncilState?: string | null;
    city?: string | null;
  },
>(): Column<T> {
  return {
    key: "barCouncil",
    header: "Bar council / ID",
    filterValue: (r) =>
      r.barCouncilState?.replace(/^Bar Council of\s+/i, "") || "Not provided",
    sortValue: (r) => r.barCouncilState ?? "",
    textValue: (r) => `${r.barCouncilState ?? ""} ${r.barId}`,
    cell: (r) => (
      <StackedCell
        primary={
          r.barCouncilState?.replace(/^Bar Council of\s+/i, "") ||
          "Council not provided"
        }
        secondary={
          <span className="font-mono text-[11px]">
            {r.barId || "Enrolment not provided"}
          </span>
        }
      />
    ),
  };
}
