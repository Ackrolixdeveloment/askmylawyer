"use client";

import { MoreVertical, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDismissable } from "@/hooks/use-dismissable";
import { cn } from "@/lib/utils";

export interface MenuAction {
  label: string;
  onSelect: () => void;
  /** Optional leading glyph. */
  icon?: LucideIcon;
  /** Renders the item in red, for destructive actions. */
  destructive?: boolean;
}

interface DropdownMenuProps {
  actions: MenuAction[];
  label?: string;
  align?: "left" | "right";
  /** Compact variant: glyphs only, with the label exposed to assistive tech. */
  iconOnly?: boolean;
  className?: string;
}

/** Where the floating menu sits, in viewport coordinates. */
interface Position {
  top: number;
  left?: number;
  right?: number;
}

const GAP = 4;
/** Keeps the menu clear of the viewport edges. */
const EDGE = 8;

/**
 * Kebab menu used for per-row actions in tables.
 *
 * The menu is rendered into `document.body` and positioned against its
 * trigger, so a table's own scroll container can never clip it. It flips
 * above the trigger when there isn't room below.
 *
 * Closes on outside click, Escape, or after an action runs.
 */
export function DropdownMenu({
  actions,
  label = "Row actions",
  align = "right",
  iconOnly = false,
  className,
}: DropdownMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);

  // The menu sits outside the trigger in the DOM, so both count as "inside".
  const dismissRefs = useMemo(() => [triggerRef, menuRef], []);
  useDismissable(dismissRefs, open, () => setOpen(false));

  const place = useCallback(
    (menuHeight: number): Position | null => {
      const trigger = triggerRef.current;
      if (!trigger) return null;

      const rect = trigger.getBoundingClientRect();
      const roomBelow = window.innerHeight - rect.bottom;
      const flipUp =
        menuHeight > 0 && roomBelow < menuHeight + EDGE && rect.top > menuHeight;

      return {
        top: flipUp ? rect.top - menuHeight - GAP : rect.bottom + GAP,
        ...(align === "right"
          ? { right: Math.max(EDGE, window.innerWidth - rect.right) }
          : { left: Math.max(EDGE, rect.left) }),
      };
    },
    [align],
  );

  /** Measured once the menu is in the DOM, so it can flip if needed. */
  const attachMenu = useCallback(
    (node: HTMLDivElement | null) => {
      menuRef.current = node;
      if (node) setPosition(place(node.offsetHeight));
    },
    [place],
  );

  // Follow the trigger while the page or a table scrolls underneath.
  useEffect(() => {
    if (!open) return;

    function reposition() {
      const node = menuRef.current;
      if (node) setPosition(place(node.offsetHeight));
    }

    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);

    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, place]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    // A first guess before the menu is measured, so it opens in place.
    setPosition(place(0));
    setOpen(true);
  }

  const menu = open ? (
    <div
      ref={attachMenu}
      role="menu"
      style={{
        position: "fixed",
        top: position?.top ?? 0,
        left: position?.left,
        right: position?.right,
        visibility: position ? "visible" : "hidden",
      }}
      className={cn(
        "z-50 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl",
        iconOnly ? "w-auto" : "w-40",
      )}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              action.onSelect();
            }}
            aria-label={iconOnly ? action.label : undefined}
            title={iconOnly ? action.label : undefined}
            className={cn(
              "flex w-full items-center text-left text-sm transition-colors hover:bg-slate-50",
              iconOnly ? "justify-center px-3 py-2.5" : "gap-2.5 px-4 py-2.5",
              action.destructive ? "text-negative" : "text-ink",
            )}
          >
            {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
            {iconOnly ? null : action.label}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div className={cn("inline-block", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <MoreVertical className="size-[18px]" aria-hidden />
      </button>

      {/* Outside the table, so its scroll container cannot clip the menu. */}
      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
