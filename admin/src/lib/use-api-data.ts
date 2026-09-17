"use client";

import { useEffect, useState } from "react";
import { ApiError } from "./api";

/** Loads data for a screen, with a retry for when the server is unreachable. */
export function useApiData<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /** Bumped by retry() to run the effect again. */
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    load()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Could not load this screen.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `load` is rebuilt on every render; the screen reloads on retry or deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, ...deps]);

  function retry() {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  }

  return { data, loading, error, retry };
}
