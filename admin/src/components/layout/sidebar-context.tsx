"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

interface SidebarContextValue {
  /** Mobile drawer. */
  open: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  /** Desktop rail. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  expandSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * The desktop collapse lives outside React so it can be read straight from
 * localStorage on the first client render without a flash or a setState in
 * an effect.
 */
const STORAGE_KEY = "aml.sidebar-collapsed";
const listeners = new Set<() => void>();
let collapsedValue: boolean | null = null;

function readCollapsed() {
  if (collapsedValue === null) {
    try {
      collapsedValue = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // Private mode or blocked storage — the rail just starts open.
      collapsedValue = false;
    }
  }
  return collapsedValue;
}

function writeCollapsed(next: boolean) {
  collapsedValue = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    // Not worth failing the click over.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Tracks the mobile drawer state and, from `lg` up, whether the sidebar is
 * collapsed to an icon rail.
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);

  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);
  const toggleCollapsed = useCallback(() => writeCollapsed(!readCollapsed()), []);
  const expandSidebar = useCallback(() => writeCollapsed(false), []);

  const value = useMemo(
    () => ({
      open,
      openSidebar,
      closeSidebar,
      collapsed,
      toggleCollapsed,
      expandSidebar,
    }),
    [open, openSidebar, closeSidebar, collapsed, toggleCollapsed, expandSidebar],
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
