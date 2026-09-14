/** Placeholder departments — replace with the admin API. */
import type { Department } from "@/types/department";

export const departments: Department[] = [
  {
    id: "dept-1",
    name: "Billing Mangment",
    code: "BILL",
    description: "Handles invoicing, payouts and billing disputes.",
    members: 1,
    status: "active",
  },
  {
    id: "dept-2",
    name: "Lawyer Management",
    code: "LAW",
    description: "Onboarding, verification and empanelment of lawyers.",
    members: 0,
    status: "active",
  },
  {
    id: "dept-3",
    name: "Customer Management",
    code: "CUST",
    description: "Customer accounts, bookings and support escalations.",
    members: 0,
    status: "active",
  },
  {
    id: "dept-4",
    name: "Referrals",
    code: "REF",
    description: "Referral scheme, rewards and payouts.",
    members: 1,
    status: "active",
  },
  {
    id: "dept-5",
    name: "User Management",
    code: "USER",
    description: "Admin users, roles and access permissions.",
    members: 2,
    status: "active",
  },
];
