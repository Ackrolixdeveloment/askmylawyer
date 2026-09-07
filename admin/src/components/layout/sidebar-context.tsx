"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface SidebarContextValue {
  open: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * Tracks the mobile drawer state. On `lg` and up the sidebar is always
 * visible and this state is simply unused.
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openSidebar, closeSidebar }),
    [open, openSidebar, closeSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
