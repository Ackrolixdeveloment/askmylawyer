"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useState } from "react";
import { collectHrefs, navSections } from "@/lib/nav";
import { SidebarNavItem } from "./sidebar-nav-item";
import { UserMenu } from "./user-menu";

/** `onNavigate` is supplied by the mobile drawer so tapping a link closes it. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
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
    <aside className="flex h-dvh w-[328px] max-w-[85vw] shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center justify-between gap-2 px-5 py-6 sm:px-6">
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
          <span className="text-[20px] font-semibold ">
            ASK MY LAWYER
          </span>
        </Link>

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

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-6 sm:px-4">
        {navSections.map((section, index) => (
          <div key={section.label ?? `section-${index}`} className="mb-2">
            {section.label ? (
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
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <UserMenu />
    </aside>
  );
}
