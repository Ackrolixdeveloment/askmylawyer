/** Placeholder categories and roles — replace with the admin API. */
import type { AdminRole, Category } from "@/types/category";

/**
 * Departments a category or role can belong to. Kept separate from the
 * admin's own section list, which names panel areas rather than teams.
 */
export const departmentOptions = [
  { value: "", label: "Select" },
  { value: "Product", label: "Product" },
  { value: "Payment", label: "Payment" },
  { value: "Support", label: "Support" },
  { value: "Operations", label: "Operations" },
  { value: "Finance", label: "Finance" },
  { value: "Compliance", label: "Compliance" },
];

export const categories: Category[] = Array.from(
  { length: 5 },
  (_, index) => ({
    id: `category-${index + 1}`,
    name: "Payment Failed",
    department: "Product",
    status: "active",
  }),
);

const rolePermissions = [2, 2, 1, 1, 1];

export const adminRoles: AdminRole[] = rolePermissions.map(
  (permissions, index) => ({
    id: `role-${index + 1}`,
    name: "Refund",
    department: "Payment",
    description: "",
    permissions,
    status: "active",
  }),
);
