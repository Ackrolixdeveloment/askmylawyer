"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Card, type BadgeTone } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DraftTab } from "@/types/lawyer";

interface ProfileOverviewProps {
  name: string;
  statusLabel: string;
  statusTone: BadgeTone;
  practiceType: string;
  email: string;
  mobile: string;
  tabs: DraftTab[];
  backHref: string;
  backLabel: string;
  /** Small caption above "Read-only overview" in the footer. */
  footerCaption: string;
}

/**
 * Read-only snapshot of everything captured during registration.
 * Shared by the draft profiles and the verified lawyer views.
 */
export function ProfileOverview({
  name,
  statusLabel,
  statusTone,
  practiceType,
  email,
  mobile,
  tabs,
  backHref,
  backLabel,
  footerCaption,
}: ProfileOverviewProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);
  const current = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <Badge tone={statusTone}>{statusLabel}</Badge>
        <h1 className="mt-3 text-2xl font-bold text-ink">{name}</h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
          <span className="flex items-center gap-2">
            Type:
            <Badge tone="info">{practiceType}</Badge>
          </span>
          <span aria-hidden>•</span>
          <span>{email}</span>
          <span aria-hidden>•</span>
          <span>{mobile}</span>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div
          role="tablist"
          aria-label="Registration sections"
          className="flex overflow-x-auto border-b border-line"
        >
          {tabs.map((tab) => {
            const active = tab.id === current?.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 border-b-2 px-6 py-4 text-sm font-medium transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
                  active
                    ? "border-brand text-brand"
                    : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-4 p-5">
          {current?.sections.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-line bg-slate-50/50 p-5"
            >
              <p className="border-l-2 border-brand pl-2.5 text-sm font-semibold text-ink">
                {section.title}
              </p>

              <dl className="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div key={field.label} className="min-w-0">
                    <dt className="text-xs tracking-wide text-ink-muted">
                      {field.label}
                    </dt>
                    {/* Drafts are incomplete, so empty values show as a dash. */}
                    <dd
                      className={cn(
                        "mt-1 text-sm",
                        field.value ? "font-medium text-ink" : "text-ink-subtle",
                      )}
                    >
                      {field.value ?? "-"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-ink-muted">{footerCaption}</p>
          <p className="mt-0.5 text-lg font-semibold text-ink">
            Read-only overview
          </p>
        </div>

        <Link
          href={backHref}
          className="rounded-lg bg-blue-50 px-5 py-3 text-sm font-medium text-brand transition-colors hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          {backLabel}
        </Link>
      </Card>
    </div>
  );
}
