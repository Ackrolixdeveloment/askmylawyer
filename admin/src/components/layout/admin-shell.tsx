"use client";

import { useEffect } from "react";
import { PreviewFlowHost } from "./preview-flow-host";
import { DemoModeBanner } from "./demo-mode-banner";
import { Sidebar } from "./sidebar";
import { SidebarProvider, useSidebar } from "./sidebar-context";

function Shell({ children }: { children: React.ReactNode }) {
  const { open, closeSidebar, collapsed, toggleCollapsed, expandSidebar } =
    useSidebar();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const drawer = document.querySelector<HTMLElement>(
      "[data-mobile-navigation]",
    );
    const controls = () =>
      Array.from(
        drawer?.querySelectorAll<HTMLElement>("button, a[href]") ?? [],
      ).filter((el) => el.offsetParent !== null);
    controls()[0]?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeSidebar();
      if (event.key === "Tab") {
        const items = controls();
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, closeSidebar]);
  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      {/* Persistent sidebar from lg up. */}
      <div className="hidden lg:flex">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          onExpand={expandSidebar}
        />
      </div>

      {/* Drawer below lg. */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={closeSidebar}
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-y-0 left-0 transition-transform duration-200 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div
            data-mobile-navigation
            role={open ? "dialog" : undefined}
            aria-modal={open ? true : undefined}
            aria-label="Mobile navigation"
          >
            <Sidebar onNavigate={closeSidebar} />
          </div>
        </div>
      </div>

      <div
        className="flex min-w-0 flex-1 flex-col overflow-y-auto"
        inert={open}
      >
        <DemoModeBanner />
        {children}
        <PreviewFlowHost />
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Shell>{children}</Shell>
    </SidebarProvider>
  );
}
