/**
 * Placeholder customer data — replace with the admin API.
 * Shapes live in `src/types/customer.ts`.
 */
import { BarChart3, TrendingUp, UserRoundSearch } from "lucide-react";
import type { Customer } from "@/types/customer";

export const customerMetrics = [
  {
    id: "total",
    label: "Total Customers",
    value: "12,211",
    tone: "brand",
    icon: UserRoundSearch,
  },
  {
    id: "active",
    label: "Active Customers",
    value: "2,841",
    tone: "positive",
    icon: TrendingUp,
  },
  {
    id: "new",
    label: "New Registrations",
    value: 12,
    tone: "negative",
    icon: BarChart3,
  },
  {
    id: "suspended",
    label: "Suspended",
    value: 2,
    tone: "negative",
    icon: BarChart3,
  },
] as const;

const lastActive = [
  "2026-07-23",
  "2026-09-02",
  "2026-08-31",
  "2026-07-23",
  "2026-07-23",
];

export const customers: Customer[] = Array.from({ length: 22 }, (_, index) => ({
  id: `customer-${index + 1}`,
  name: "Rajesh Kumar",
  contact: "Rajesh Kumar",
  city: "Ghaziabad",
  joinedOn: "2026-07-23",
  consults: (index % 3) + 1,
  lastActiveOn: lastActive[index % lastActive.length],
  status: index % 11 === 0 ? "suspended" : "active",
}));