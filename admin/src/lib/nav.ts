import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Briefcase,
  CreditCard,
  Gift,
  Headset,
  LayoutGrid,
  User,
  Users,
  UsersRound,
} from "lucide-react";

/** A plain link. */
export interface NavLeaf {
  label: string;
  href: string;
}

/** A collapsible group of links nested inside a top-level item. */
export interface NavGroup {
  label: string;
  children: NavLeaf[];
}

export type NavChild = NavLeaf | NavGroup;

export function isNavGroup(child: NavChild): child is NavGroup {
  return "children" in child;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Present when the item expands into sub-routes. */
  children?: NavChild[];
}

/** Optional heading above a run of items, e.g. "OVERVIEW". */
export interface NavSection {
  label?: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
      {
        label: "Lawyer Management",
        href: "/lawyers",
        icon: Briefcase,
        children: [
          { label: "Verified Lawyers", href: "/lawyers/verified" },
          {
            label: "Onboarding Requests",
            children: [
              { label: "New Requests", href: "/lawyers/onboarding/new" },
              { label: "Correction", href: "/lawyers/onboarding/correction" },
              { label: "Resubmission", href: "/lawyers/onboarding/resubmission" },
              { label: "Rejected Lawyers", href: "/lawyers/onboarding/rejected" },
              { label: "Draft Profiles", href: "/lawyers/onboarding/drafts" },
            ],
          },
          {
            label: "Edit Approvals",
            children: [
              { label: "Pending Requests", href: "/lawyers/edit-approvals/pending" },
              { label: "Approval Requests", href: "/lawyers/edit-approvals/approved" },
              { label: "Rejected Requests", href: "/lawyers/edit-approvals/rejected" },
              { label: "Lawyer History", href: "/lawyers/edit-approvals/history" },
              { label: "Deleted Lawyers", href: "/lawyers/edit-approvals/deleted" },
            ],
          },
        ],
      },
      { label: "Customer Management", href: "/customers", icon: User },
      { label: "User Management", href: "/users", icon: Users },
      {
        label: "Consultation Management",
        href: "/consultations",
        icon: UsersRound,
        children: [
          { label: "Completed", href: "/consultations/completed" },
          { label: "Refunded", href: "/consultations/refunded" },
          { label: "Disputed", href: "/consultations/disputed" },
          { label: "Cancelled", href: "/consultations/cancelled" },
          { label: "In Progress", href: "/consultations/in-progress" },
        ],
      },
      { label: "Billing Management", href: "/billing", icon: CreditCard },
      { label: "Referral", href: "/referral", icon: Gift },
      {
        label: "Push Notifications",
        href: "/notifications",
        icon: Bell,
        children: [
          { label: "Send Notification", href: "/notifications/send" },
          { label: "Templates", href: "/notifications/templates" },
          { label: "Scheduled", href: "/notifications/scheduled" },
        ],
      },
      {
        label: "Support",
        href: "/support",
        icon: Headset,
        children: [
          { label: "New Tickets", href: "/support/new" },
          { label: "In Progress", href: "/support/in-progress" },
          { label: "Resolved", href: "/support/resolved" },
          { label: "Departments", href: "/support/departments" },
        ],
      },
    ],
  },
];

/** Every href reachable under a nav item — used to detect the active branch. */
export function collectHrefs(item: NavItem): string[] {
  if (!item.children) return [item.href];
  return item.children.flatMap((child) =>
    isNavGroup(child) ? child.children.map((leaf) => leaf.href) : [child.href],
  );
}