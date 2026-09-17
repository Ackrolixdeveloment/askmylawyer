"use client";

import { useEffect, type RefObject } from "react";

type ElementRef = RefObject<HTMLElement | null>;

/**
 * Closes a floating element on outside click or Escape.
 * Shared by popovers, dropdowns and menus.
 *
 * Pass several refs when the floating part lives outside its trigger — a menu
 * rendered in a portal, say — so clicking inside it doesn't count as outside.
 */
export function useDismissable(
  ref: ElementRef | ElementRef[],
  active: boolean,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!active) return;

    const refs = Array.isArray(ref) ? ref : [ref];

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (refs.some((item) => item.current?.contains(target))) return;
      onDismiss();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [ref, active, onDismiss]);
}
