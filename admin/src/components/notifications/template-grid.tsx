"use client";

import { useRouter } from "next/navigation";
import { useAdmin } from "@/components/layout/auth-guard";
import { Card } from "@/components/ui";
import { canChange } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { NotificationTemplate, TemplateTone } from "@/types/notification";

/** Each tone gets its own header band, matching the design. */
const toneClasses: Record<TemplateTone, { band: string; name: string }> = {
  welcome: { band: "bg-emerald-50", name: "text-emerald-700" },
  promo: { band: "bg-violet-50", name: "text-violet-700" },
};

export function TemplateGrid({
  templates,
}: {
  templates: NotificationTemplate[];
}) {
  const router = useRouter();
  // Using a template carries it into the composer, which is a send action.
  const canSend = canChange(useAdmin(), "notifications.send");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {templates.map((template) => {
        const tone = toneClasses[template.tone];

        return (
          <Card key={template.id} className="overflow-hidden">
            <div className={cn("px-5 py-4", tone.band)}>
              <p className={cn("text-sm font-semibold", tone.name)}>
                {template.name}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">{template.context}</p>
            </div>

            <div className="p-5">
              <p className="text-sm font-semibold text-ink">{template.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                {template.body}
              </p>

              {canSend ? (
                <button
                  type="button"
                  // Carries the template into the composer.
                  onClick={() =>
                    router.push(`/notifications/send?template=${template.id}`)
                  }
                  className="mt-4 w-full rounded-lg border border-line px-4 py-2.5 text-sm text-ink-muted transition-colors hover:bg-slate-50 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                >
                  Use template
                </button>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
