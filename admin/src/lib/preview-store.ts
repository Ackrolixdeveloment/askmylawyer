"use client";
import { useSyncExternalStore } from "react";
const memory = new Map<string, string>();
function subscribe(callback: () => void) {
  window.addEventListener("aml-preview-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("aml-preview-change", callback);
    window.removeEventListener("storage", callback);
  };
}
/** Explicitly scoped, non-authoritative UI drafts; never a substitute for API state. */
export function usePreviewRecord<T extends object>(key: string, initial: T) {
  const storageKey = `aml-ui-preview:${key}`;
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return (
          sessionStorage.getItem(storageKey) ?? memory.get(storageKey) ?? "{}"
        );
      } catch {
        return memory.get(storageKey) ?? "{}";
      }
    },
    () => "{}",
  );
  let saved: Partial<T> = {};
  try {
    saved = JSON.parse(raw);
  } catch {
    /* Invalid preview data is ignored. */
  }
  function save(next: Partial<T>) {
    const value = JSON.stringify({ ...initial, ...saved, ...next });
    memory.set(storageKey, value);
    try {
      sessionStorage.setItem(storageKey, value);
    } catch {
      /* Keep the draft in memory when browser storage is unavailable. */
    }
    window.dispatchEvent(new Event("aml-preview-change"));
  }
  return [{ ...initial, ...saved }, save] as const;
}

export function updatePreviewRecord(
  key: string,
  patch: Record<string, unknown>,
) {
  const storageKey = `aml-ui-preview:${key}`;
  let previous: Record<string, unknown> = {};
  try {
    previous = JSON.parse(
      sessionStorage.getItem(storageKey) ?? memory.get(storageKey) ?? "{}",
    );
  } catch {
    /* Start a new preview. */
  }
  const value = JSON.stringify({ ...previous, ...patch });
  memory.set(storageKey, value);
  try {
    sessionStorage.setItem(storageKey, value);
  } catch {
    /* Keep in memory. */
  }
  window.dispatchEvent(new Event("aml-preview-change"));
}
