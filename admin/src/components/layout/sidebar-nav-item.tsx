"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  isNavGroup,
  type NavChild,
  type NavGroup,
  type NavItem,
} from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * A list stays highlighted while one of its detail pages is open.
 *
 * `siblings` guards against a shorter href swallowing a longer one: "/users"
 * would otherwise also match "/users/roles" and light up two entries at once.
 */
function isActive(pathname: string, href: string, siblings: string[] = []) {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;

  return !siblings.some(
    (other) =>
      other !== href &&
      other.startsWith(`${href}/`) &&
      (pathname === other || pathname.startsWith(`${other}/`)),
  );
}

/** Every leaf href directly under a nav item, for the guard above. */
function leafHrefs(children: NavChild[] | undefined): string[] {
  return (children ?? []).flatMap((child) =>
    isNavGroup(child) ? child.children.map((leaf) => leaf.href) : [child.href],
  );
}

interface SidebarNavItemProps {
  item: NavItem;
  /** Current pathname, used to highlight the active branch. */
  pathname: string;
  branchActive: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  /** Icon-only rail: labels are hidden and children stay tucked away. */
  collapsed?: boolean;
  /** Opens the rail back up, so a clicked item can show its children. */
  onExpand?: () => void;
}

export function SidebarNavItem({
  item,
  pathname,
  branchActive,
  expanded,
  onToggle,
  onNavigate,
  collapsed = false,
  onExpand,
}: SidebarNavItemProps) {
  const Icon = item.icon;

  const rowClasses = cn(
    "flex w-full items-center gap-2.5 rounded-lg py-3 text-base font-medium transition-colors",
    collapsed ? "justify-center px-0" : "px-3",
    "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
    branchActive && !item.children
      ? "bg-sidebar-highlight font-semibold text-sidebar-active"
      : "text-sidebar-fg hover:bg-sidebar-highlight hover:text-sidebar-active",
    branchActive && item.children && "text-sidebar-active",
  );

  if (!item.children) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={rowClasses}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="size-[18px] shrink-0" aria-hidden />
        {collapsed ? (
          <span className="sr-only">{item.label}</span>
        ) : (
          <span className="truncate">{item.label}</span>
        )}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        // On the rail there is no room for the children, so a click opens the
        // sidebar back up on this item.
        onClick={() => {
          if (collapsed) onExpand?.();
          if (!collapsed || !expanded) onToggle();
        }}
        aria-expanded={collapsed ? undefined : expanded}
        className={rowClasses}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="size-[18px] shrink-0" aria-hidden />
        {collapsed ? (
          <span className="sr-only">{item.label}</span>
        ) : (
          <>
            <span className="flex-1 truncate text-left">{item.label}</span>
            <ChevronDown
              className={cn("size-4 shrink-0 transition-transform", expanded && "rotate-180")}
              aria-hidden
            />
          </>
        )}
      </button>

      {expanded && !collapsed ? (
        <ItemChildren item={item} pathname={pathname} onNavigate={onNavigate} />
      ) : null}
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
  const siblings = leafHrefs(item.children);

  const activeGroup =
    item.children?.find(
      (child) =>
        isNavGroup(child) &&
        child.children.some((leaf) =>
          isActive(pathname, leaf.href, siblings),
        ),
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
              siblings={siblings}
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
              active={isActive(pathname, child.href, siblings)}
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
  siblings,
  expanded,
  onToggle,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  siblings: string[];
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  /** Icon-only rail: labels are hidden and children stay tucked away. */
  collapsed?: boolean;
  /** Opens the rail back up, so a clicked item can show its children. */
  onExpand?: () => void;
}) {
  const groupActive = group.children.some((leaf) =>
    isActive(pathname, leaf.href, siblings),
  );

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