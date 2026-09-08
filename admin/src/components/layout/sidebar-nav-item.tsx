"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { isNavGroup, type NavGroup, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** A list stays highlighted while one of its detail pages is open. */
function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface SidebarNavItemProps {
  item: NavItem;
  /** Current pathname, used to highlight the active branch. */
  pathname: string;
  branchActive: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

export function SidebarNavItem({
  item,
  pathname,
  branchActive,
  expanded,
  onToggle,
  onNavigate,
}: SidebarNavItemProps) {
  const Icon = item.icon;

  const rowClasses = cn(
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-3 text-base font-medium transition-colors",
    "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
    branchActive && !item.children
      ? "bg-sidebar-highlight font-semibold text-sidebar-active"
      : "text-sidebar-fg hover:bg-sidebar-highlight hover:text-sidebar-active",
    branchActive && item.children && "text-sidebar-active",
  );

  if (!item.children) {
    return (
      <Link href={item.href} onClick={onNavigate} className={rowClasses}>
        <Icon className="size-[18px] shrink-0" aria-hidden />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={rowClasses}
      >
        <Icon className="size-[18px] shrink-0" aria-hidden />
        <span className="flex-1 truncate text-left">{item.label}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", expanded && "rotate-180")}
          aria-hidden
        />
      </button>

      {expanded ? <ItemChildren item={item} pathname={pathname} onNavigate={onNavigate} /> : null}
    </div>
  );
}

/**
 * Second level. Only one nested group stays open at a time, mirroring the
 * accordion behaviour of the top-level items.
 */
function ItemChildren({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const activeGroup =
    item.children?.find(
      (child) =>
        isNavGroup(child) &&
        child.children.some((leaf) => isActive(pathname, leaf.href)),
    )?.label ?? null;

  // `undefined` means "follow the route"; clicking pins a specific group.
  const [openGroup, setOpenGroup] = useState<string | null | undefined>(undefined);
  const effectiveOpen = openGroup === undefined ? activeGroup : openGroup;

  return (
    // Guide rail sits under the icon, giving the branch a tree shape.
    <ul className="mt-1 ml-[22px] space-y-0.5 border-l border-line pl-3">
      {item.children?.map((child) =>
        isNavGroup(child) ? (
          <li key={child.label}>
            <NavSubGroup
              group={child}
              pathname={pathname}
              expanded={effectiveOpen === child.label}
              onToggle={() =>
                setOpenGroup(effectiveOpen === child.label ? null : child.label)
              }
              onNavigate={onNavigate}
            />
          </li>
        ) : (
          <li key={child.href}>
            <SubLink
              href={child.href}
              label={child.label}
              active={isActive(pathname, child.href)}
              onNavigate={onNavigate}
            />
          </li>
        ),
      )}
    </ul>
  );
}

/** Collapsible group, e.g. "Onboarding Requests". */
function NavSubGroup({
  group,
  pathname,
  expanded,
  onToggle,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const groupActive = group.children.some((leaf) => isActive(pathname, leaf.href));

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] transition-colors",
          "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
          groupActive
            ? "text-sidebar-active"
            : "text-sidebar-fg hover:text-sidebar-active",
        )}
      >
        <span className="flex-1 truncate text-left">{group.label}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", expanded && "rotate-180")}
          aria-hidden
        />
      </button>

      {expanded ? (
        <ul className="ml-3 space-y-0.5 border-l border-line pl-3">
          {group.children.map((leaf) => (
            <li key={leaf.href}>
              <SubLink
                href={leaf.href}
                label={leaf.label}
                active={isActive(pathname, leaf.href)}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SubLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block truncate rounded-lg px-3 py-2.5 text-[15px] transition-colors",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
        active
          ? "bg-sidebar-highlight font-semibold text-sidebar-active"
          : "text-sidebar-fg hover:bg-sidebar-highlight hover:text-sidebar-active",
      )}
    >
      {label}
    </Link>
  );
}