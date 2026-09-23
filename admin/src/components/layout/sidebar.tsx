"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft, X } from "lucide-react";
import { useState } from "react";
import { collectHrefs, navSections } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { SidebarNavItem } from "./sidebar-nav-item";
import { UserMenu } from "./user-menu";

interface SidebarProps {
  /** Supplied by the mobile drawer so tapping a link closes it. */
  onNavigate?: () => void;
  /** Icon-only rail. Desktop only — the drawer always shows labels. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Opens the rail back up when a collapsed item is clicked. */
  onExpand?: () => void;
}

export function Sidebar({
  onNavigate,
  collapsed = false,
  onToggleCollapsed,
  onExpand,
}: SidebarProps) {
  const pathname = usePathname();

  const isBranchActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const activeItem =
    navSections
      .flatMap((section) => section.items)
      .find((item) => collectHrefs(item).some(isBranchActive))?.href ?? null;

  // Accordion: one expandable item at a time. `undefined` means "follow the
  // route", so the active branch opens on navigation until the user clicks.
  const [openItem, setOpenItem] = useState<string | null | undefined>(undefined);
  const expandedItem = openItem === undefined ? activeItem : openItem;

  return (
    <aside
      className={cn(
        "flex h-dvh max-w-[85vw] shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-[328px]",
      )}
    >
      <div
        className={cn(
          "flex gap-2 py-6",
          collapsed
            ? "flex-col items-center px-2"
            : "items-center justify-between px-5 sm:px-6",
        )}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <Image
            src="/logo.png"
            alt=""
            width={34}
            height={36}
            className="h-9 w-auto"
            priority
          />
          {collapsed ? null : (
            <span className="text-[20px] font-semibold ">ASK MY LAWYER</span>
          )}
        </Link>

        {onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <PanelLeft
              className={cn("size-5 transition-transform", collapsed && "rotate-180")}
              aria-hidden
            />
          </button>
        ) : null}

        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close menu"
            className="rounded-lg p-2 text-ink-muted hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none lg:hidden"
          >
            <X className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <nav
        aria-label="Main"
        className={cn(
          "flex-1 overflow-y-auto pb-6",
          collapsed ? "px-2" : "px-3 sm:px-4",
        )}
      >
        {navSections.map((section, index) => (
          <div key={section.label ?? `section-${index}`} className="mb-2">
            {section.label && !collapsed ? (
              <p className="px-4 pt-3 pb-2 text-xs font-semibold tracking-wider text-ink-subtle uppercase">
                {section.label}
              </p>
            ) : null}

            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <SidebarNavItem
                    item={item}
                    pathname={pathname}
                    branchActive={collectHrefs(item).some(isBranchActive)}
                    expanded={expandedItem === item.href}
                    onToggle={() =>
                      setOpenItem(expandedItem === item.href ? null : item.href)
                    }
                    onNavigate={onNavigate}
                    collapsed={collapsed}
                    onExpand={onExpand}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <UserMenu collapsed={collapsed} />
    </aside>
  );
}
