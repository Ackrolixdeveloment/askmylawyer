"use client";

import { Button, Card } from "@/components/ui";

/**
 * Shared loading / error frame for screens that fetch from the admin API.
 * Renders the screen only once its data has arrived.
 */
export function ScreenState({
  loading,
  error,
  onRetry,
  loadingLabel = "Loading…",
  children,
}: {
  loading: boolean;
  error: string;
  onRetry: () => void;
  loadingLabel?: string;
  children: React.ReactNode;
}) {
  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-ink-muted">{error}</p>
        <Button onClick={onRetry} className="mt-4">
          Try again
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-ink-muted">{loadingLabel}</p>
      </Card>
    );
  }

  return <>{children}</>;
}

/** Filter choices built from the rows on screen, so they always match the data. */
export function optionsFrom(
  values: (string | null | undefined)[],
  allLabel: string,
) {
  const unique = [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ];
  unique.sort((a, b) => a.localeCompare(b));

  return [
    { value: "all", label: allLabel },
    ...unique.map((value) => ({ value, label: value })),
  ];
}

/** Ranges used by the "days waiting" filters. */
export const daysWaitingOptions = [
  { value: "all", label: "Days waiting" },
  { value: "0-2", label: "0-2 days" },
  { value: "3-5", label: "3-5 days" },
  { value: "5+", label: "5+ days" },
];
