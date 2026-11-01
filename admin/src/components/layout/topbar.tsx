"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RefreshCw,
  ArrowUpRight,
  ChevronRight,
  Command,
  Menu,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { canSee } from "@/lib/auth";
import { keyForPath } from "@/lib/modules";
import { isNavGroup, navSections } from "@/lib/nav";
import { NotificationBell } from "./notification-bell";
import { useAdmin } from "./auth-guard";
import { useSidebar } from "./sidebar-context";

export function Topbar({ title }: { title: string; showDateRange?: boolean }) {
  const { openSidebar } = useSidebar();
  const admin = useAdmin();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const items = navSections.flatMap((s) => s.items);
  const links = items
    .flatMap((item) =>
      item.children
        ? item.children.flatMap((child) =>
            isNavGroup(child)
              ? child.children.map((leaf) => ({ ...leaf, group: item.label }))
              : [{ ...child, group: item.label }],
          )
        : [{ label: item.label, href: item.href, group: "Workspace" }],
    )
    .filter((link) => {
      const key = keyForPath(link.href);
      return !key || canSee(admin, key);
    });
  const active = links
    .filter((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const parent = items
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
  const group =
    active?.group === "Workspace"
      ? active.label
      : (active?.group ?? parent?.label ?? title);
  const previewData =
    /^\/(support|billing|referral)(\/|$)/.test(pathname) ||
    pathname === "/consultations/disputed" ||
    (/^\/consultations\/(?!all$|scheduled$|reports$|completed$|cancelled$|refunded$|in-progress$|disputed$)[^/]+$/.test(
      pathname,
    ) &&
      !/^\/consultations\/[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(pathname));
  const results = query.trim()
    ? links.filter((l) =>
        `${l.label} ${l.group}`.toLowerCase().includes(query.toLowerCase()),
      )
    : [];
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={openSidebar}
            aria-label="Open menu"
            className="table-tool lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
              <Link href="/dashboard" className="hover:text-brand">
                Workspace
              </Link>
              <ChevronRight className="size-3" />
              <span className="truncate">{group}</span>
              {active?.label && active.label !== group && (
                <>
                  <ChevronRight className="hidden size-3 sm:block" />
                  <span className="hidden truncate text-ink sm:block">
                    {active.label}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            aria-label="Refresh current screen"
            title="Refresh current screen"
            className="table-tool"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="size-4" />
          </button>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-line bg-canvas/70 px-3 py-2.5 text-sm text-ink-muted hover:border-blue-200"
            aria-label="Find a page"
          >
            <Search className="size-4" />
            <span className="hidden md:inline">Find a page…</span>
            <kbd className="hidden items-center gap-0.5 rounded border border-line bg-white px-1.5 py-0.5 text-[10px] md:flex">
              <Command className="size-2.5" />K
            </kbd>
          </button>
          <span className="hidden items-center gap-1.5 text-[11px] font-medium text-ink-muted xl:flex">
            <ShieldCheck className="size-4 text-brand" />
            Admin workspace
          </span>
          <NotificationBell />
          <span
            title={admin.name}
            className="grid size-9 place-items-center rounded-xl bg-ink text-xs font-semibold text-white"
          >
            {admin.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </span>
        </div>
      </header>
      {previewData && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-blue-100 bg-brand-soft/70 px-4 py-2 text-[11px] text-brand sm:px-6 lg:px-8">
          <span>Preview workspace · Demonstration records</span>
          <span>Changes apply to this browser session only</span>
        </div>
      )}
      <dialog
        ref={dialog}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(92vw,600px)] rounded-2xl border border-line bg-white p-0 shadow-2xl backdrop:bg-ink/40"
        aria-labelledby="page-search-title"
      >
        <div className="flex items-center gap-3 border-b border-line p-5">
          <Search className="size-5 text-brand" />
          <label id="page-search-title" className="sr-only">
            Find an admin page
          </label>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, billing, settings…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <button onClick={() => setOpen(false)} aria-label="Close page search">
            <X className="size-5 text-ink-muted" />
          </button>
        </div>
        <div className="max-h-[55vh] overflow-auto p-2">
          {results.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
              className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-brand-soft"
            >
              <div>
                <p className="text-sm font-medium">{link.label}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{link.group}</p>
              </div>
              <ArrowUpRight className="size-4 text-ink-muted" />
            </Link>
          ))}
          {results.length === 0 && (
            <p className="p-8 text-center text-sm text-ink-muted">
              {query.trim()
                ? "No pages found. Try another keyword."
                : "Type a page name to jump to it."}
            </p>
          )}
        </div>
        <p className="border-t border-line px-5 py-3 text-xs text-ink-muted">
          Search workspace pages · Press Esc to close
        </p>
      </dialog>
    </>
  );
}
