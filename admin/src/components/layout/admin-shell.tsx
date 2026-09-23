"use client";

import { Sidebar } from "./sidebar";
import { SidebarProvider, useSidebar } from "./sidebar-context";

function Shell({ children }: { children: React.ReactNode }) {
  const { open, closeSidebar, collapsed, toggleCollapsed, expandSidebar } =
    useSidebar();

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
          <Sidebar onNavigate={closeSidebar} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {children}
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
