import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Briefcase,
  CreditCard,
  Gift,
  Headset,
  LayoutGrid,
  Settings,
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
        label: "Lawyers",
        href: "/lawyers",
        icon: Briefcase,
        children: [
          { label: "All Registered Lawyers", href: "/lawyers/all" },
          { label: "Verified Lawyers", href: "/lawyers/verified" },
          {
            label: "Onboarding Requests",
            children: [
              { label: "Awaiting Review", href: "/lawyers/onboarding/new" },
              {
                label: "Changes Requested",
                href: "/lawyers/onboarding/correction",
              },
              {
                label: "Resubmitted",
                href: "/lawyers/onboarding/resubmission",
              },
              {
                label: "Rejected Lawyers",
                href: "/lawyers/onboarding/rejected",
              },
              { label: "Draft Profiles", href: "/lawyers/onboarding/drafts" },
            ],
          },
          {
            label: "Edit Approvals",
            children: [
              {
                label: "Pending Requests",
                href: "/lawyers/edit-approvals/pending",
              },
              {
                label: "Approved Requests",
                href: "/lawyers/edit-approvals/approved",
              },
              {
                label: "Rejected Requests",
                href: "/lawyers/edit-approvals/rejected",
              },
            ],
          },
          { label: "Deleted Lawyers", href: "/lawyers/deleted" },
        ],
      },
      { label: "Customers", href: "/customers", icon: User },
      {
        label: "Team & access",
        href: "/users",
        icon: Users,
        children: [
          { label: "Departments", href: "/users/departments" },
          { label: "Roles & Permissions", href: "/users/roles" },
          { label: "Users", href: "/users" },
        ],
      },
      {
        label: "Consultations",
        href: "/consultations",
        icon: UsersRound,
        children: [
          { label: "All Consultations", href: "/consultations/all" },
          { label: "Scheduled", href: "/consultations/scheduled" },
          { label: "Reports Pending", href: "/consultations/reports" },
          { label: "Completed", href: "/consultations/completed" },
          { label: "Refunds", href: "/consultations/refunded" },
          { label: "Disputed", href: "/consultations/disputed" },
          { label: "Cancelled", href: "/consultations/cancelled" },
          { label: "In Progress", href: "/consultations/in-progress" },
        ],
      },
      { label: "Billing & payouts", href: "/billing", icon: CreditCard },
      { label: "Referral", href: "/referral", icon: Gift },
      {
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
        children: [
          { label: "My Notifications", href: "/notifications/alerts" },
          { label: "Send Notification", href: "/notifications/send" },
          { label: "History", href: "/notifications/history" },
          { label: "Templates", href: "/notifications/templates" },
          { label: "Scheduled", href: "/notifications/scheduled" },
        ],
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        children: [
          { label: "App Setting", href: "/settings/app" },
          { label: "Consultation Engine", href: "/settings/engine" },
          { label: "Integrations", href: "/settings/integrations" },
        ],
      },
      {
        label: "Support",
        href: "/support",
        icon: Headset,
        children: [
          { label: "Ticket Categories", href: "/support/categories" },
          { label: "New Tickets", href: "/support/new" },
          { label: "In Progress", href: "/support/in-progress" },
          { label: "Resolved", href: "/support/resolved" },
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
