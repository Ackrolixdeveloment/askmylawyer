/**
 * Placeholder admin users and roles — replace with the admin API.
 *
 * Roles mirror the permission model in the platform spec: Super Admin,
 * Operations Admin and the Empanelling Advocate, plus the operational roles
 * the panel needs day to day.
 */
import type { AdminUser, Role } from "@/types/user";

export const roles: Role[] = [
  { id: "super-admin", name: "Super Admin", parentId: null, system: true },
  { id: "operations-admin", name: "Operations Admin", parentId: "super-admin", system: true },
  {
    id: "empanelling-advocate",
    name: "Empanelling Advocate",
    parentId: "super-admin",
    system: true,
  },
  { id: "finance-admin", name: "Finance Admin", parentId: "super-admin" },
  { id: "verification-officer", name: "Verification Officer", parentId: "operations-admin" },
  { id: "support-executive", name: "Support Executive", parentId: "operations-admin" },
  { id: "dispute-manager", name: "Dispute Manager", parentId: "operations-admin" },
  { id: "content-moderator", name: "Content Moderator", parentId: "operations-admin" },
  { id: "payouts-manager", name: "Payouts Manager", parentId: "finance-admin" },
  { id: "compliance-officer", name: "Compliance Officer", parentId: "empanelling-advocate" },
  { id: "marketing-manager", name: "Marketing Manager", parentId: "super-admin" },
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

export const adminUsers: AdminUser[] = [
  {
    id: "user-1",
    name: "Kainat Shakir",
    role: "Operations Admin",
    email: "kainatshakirofficial@gmail.com",
    phone: "9876543219",
    status: "active",
  },
  {
    id: "user-2",
    name: "Mukul Sisodia",
    role: "Verification Officer",
    email: "mukulsisodia@gmail.com",
    phone: "8899552530",
    status: "active",
  },
  {
    id: "user-3",
    name: "Shivani Singh",
    role: "Support Executive",
    email: "shivanisingh.aml@gmail.com",
    phone: "9717713644",
    status: "inactive",
  },
  {
    id: "user-4",
    name: "Anjali Panwar",
    role: "Super Admin",
    email: "anjali.aml@gmail.com",
    phone: "9876543210",
    status: "inactive",
  },
  {
    id: "user-5",
    name: "Piyush Tyagi",
    role: "Finance Admin",
    email: "piyush.aml@gmail.com",
    phone: "8800826030",
    status: "active",
  },
  {
    id: "user-6",
    name: "Adv. Harsh Kumar",
    role: "Empanelling Advocate",
    email: "harshkumar.aml@gmail.com",
    phone: "9310364621",
    status: "active",
  },
  {
    id: "user-7",
    name: "Jatin Singh",
    role: "Marketing Manager",
    email: "jatin@ackrolix.com",
    phone: "9873251627",
    status: "active",
  },
  {
    id: "user-8",
    name: "Surender Kumar",
    role: "Payouts Manager",
    email: "surender.aml@gmail.com",
    phone: "9205113398",
    status: "active",
  },
  {
    id: "user-9",
    name: "Neha Verma",
    role: "Dispute Manager",
    email: "neha.verma@gmail.com",
    phone: "9812233445",
    status: "active",
  },
  {
    id: "user-10",
    name: "Rohit Sharma",
    role: "Content Moderator",
    email: "rohit.sharma@gmail.com",
    phone: "9911223344",
    status: "inactive",
  },
];
