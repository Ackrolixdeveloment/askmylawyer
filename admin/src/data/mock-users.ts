/**
 * Placeholder admin users and roles — replace with the admin API.
 *
 * Roles mirror the permission model in the platform spec: Super Admin,
 * Operations and the Empanelling Advocate, plus the operational roles the
 * panel needs day to day.
 */
import type { AdminUser, Role } from "@/types/user";

export const roles: Role[] = [
  { id: "super-admin", name: "Super Admin", parentId: null, system: true },
  { id: "operations", name: "Operations", parentId: "super-admin", system: true },
  {
    id: "empanelling-advocate",
    name: "Empanelling Advocate",
    parentId: "super-admin",
    system: true,
  },
  { id: "finance", name: "Finance", parentId: "super-admin" },
  { id: "verification-officer", name: "Verification Officer", parentId: "operations" },
  { id: "support-executive", name: "Support Executive", parentId: "operations" },
  { id: "dispute-manager", name: "Dispute Manager", parentId: "operations" },
  { id: "content-moderator", name: "Content Moderator", parentId: "operations" },
  { id: "payouts-manager", name: "Payouts Manager", parentId: "finance" },
  { id: "compliance-officer", name: "Compliance Officer", parentId: "empanelling-advocate" },
  { id: "marketing", name: "Marketing", parentId: "super-admin" },
  { id: "analytics-viewer", name: "Analytics Viewer", parentId: null },
];

export const roleOptions = [
  { value: "", label: "Select a role" },
  ...roles.map((role) => ({ value: role.id, label: role.name })),
];

export const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/** Table filters — "all" is the resting state for each. */
export const roleFilterOptions = [
  { value: "all", label: "Role" },
  ...roles.map((role) => ({ value: role.name, label: role.name })),
];

export const statusFilterOptions = [
  { value: "all", label: "Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const dateFilterOptions = [
  { value: "all", label: "Date" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This week" },
];

export const adminUsers: AdminUser[] = [
  {
    id: "user-1",
    employeeCode: "EMP - 0001",
    name: "Anjali Panwar",
    role: "Super Admin",
    email: "anjali@askmylawyer.com",
    phone: "9876543210",
    lastActive: "Today",
    createdAt: "2026-09-08",
    lastUpdated: "2026-09-09",
    status: "active",
  },
  {
    id: "user-2",
    employeeCode: "EMP - 0002",
    name: "Kainat Shakir",
    role: "Operations",
    email: "kainat@askmylawyer.com",
    phone: "9876543219",
    lastActive: "Today",
    createdAt: "2026-09-07",
    lastUpdated: "2026-09-09",
    status: "active",
  },
  {
    id: "user-3",
    employeeCode: "EMP - 0003",
    name: "Piyush Tyagi",
    role: "Finance",
    email: "piyush@askmylawyer.com",
    phone: "8800826030",
    lastActive: "Today",
    createdAt: "2026-09-06",
    lastUpdated: "2026-09-09",
    status: "active",
  },
  {
    id: "user-4",
    employeeCode: "EMP - 0004",
    name: "Jatin Singh",
    role: "Marketing",
    email: "jatin@askmylawyer.com",
    phone: "9873251627",
    lastActive: "Today",
    createdAt: "2026-09-05",
    lastUpdated: "2026-09-09",
    status: "active",
  },
  {
    id: "user-5",
    employeeCode: "EMP - 0005",
    name: "Adv. Harsh Kumar",
    role: "Empanelling Advocate",
    email: "harsh@askmylawyer.com",
    phone: "9310364621",
    lastActive: "Yesterday",
    createdAt: "2026-09-04",
    lastUpdated: "2026-09-09",
    status: "active",
  },
  {
    id: "user-6",
    employeeCode: "EMP - 0006",
    name: "Mukul Sisodia",
    role: "Verification Officer",
    email: "mukul@askmylawyer.com",
    phone: "8899552530",
    lastActive: "Yesterday",
    createdAt: "2026-09-03",
    lastUpdated: "2026-09-09",
    status: "active",
  },
  {
    id: "user-7",
    employeeCode: "EMP - 0007",
    name: "Shivani Singh",
    role: "Support Executive",
    email: "shivani@askmylawyer.com",
    phone: "9717713644",
    lastActive: "3 days ago",
    createdAt: "2026-09-02",
    lastUpdated: "2026-09-09",
    status: "inactive",
  },
  {
    id: "user-8",
    employeeCode: "EMP - 0008",
    name: "Surender Kumar",
    role: "Payouts Manager",
    email: "surender@askmylawyer.com",
    phone: "9205113398",
    lastActive: "3 days ago",
    createdAt: "2026-09-01",
    lastUpdated: "2026-09-09",
    status: "active",
  },
  {
    id: "user-9",
    employeeCode: "EMP - 0009",
    name: "Neha Verma",
    role: "Dispute Manager",
    email: "neha@askmylawyer.com",
    phone: "9812233445",
    lastActive: "Today",
    createdAt: "2026-09-08",
    lastUpdated: "2026-09-09",
    status: "active",
  },
  {
    id: "user-10",
    employeeCode: "EMP - 0010",
    name: "Rohit Sharma",
    role: "Content Moderator",
    email: "rohit@askmylawyer.com",
    phone: "9911223344",
    lastActive: "3 days ago",
    createdAt: "2026-09-07",
    lastUpdated: "2026-09-09",
    status: "inactive",
  },
];
