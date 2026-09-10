"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui";
import {
  accessLevels,
  defaultPermissions,
  permissionModules,
  type AccessLevel,
} from "@/data/mock-permissions";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/types/user";

interface PermissionMatrixProps {
  user: AdminUser;
}

export function PermissionMatrix({ user }: PermissionMatrixProps) {
  const router = useRouter();
  const [levels, setLevels] = useState<Record<string, AccessLevel>>(
    defaultPermissions,
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  /** A module level cascades to the actions nested under it. */
  function setModuleLevel(moduleId: string, level: AccessLevel) {
    const group = permissionModules.find((item) => item.id === moduleId);

    setLevels((prev) => {
      const next = { ...prev, [moduleId]: level };
      for (const action of group?.actions ?? []) next[action.id] = level;
      return next;
    });
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-sm font-semibold text-white">
          {initials}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">
            {user.name}
          </div>
          <div className="truncate text-xs text-ink-muted">{user.email}</div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-line px-4 py-3.5 text-sm font-semibold text-ink">
          Permissions
        </div>

        <div className="divide-y divide-line">
          {permissionModules.map((group) => {
            const isCollapsed = collapsed[group.id] ?? false;

            return (
              <div key={group.id}>
                <div className="flex flex-wrap items-center gap-3 bg-slate-50/60 px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsed((prev) => ({
                        ...prev,
                        [group.id]: !isCollapsed,
                      }))
                    }
                    aria-expanded={!isCollapsed}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-ink-muted transition-transform",
                        isCollapsed && "-rotate-90",
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{group.label}</span>
                  </button>

                  <LevelPicker
                    label={group.label}
                    value={levels[group.id] ?? "none"}
                    onChange={(level) => setModuleLevel(group.id, level)}
                  />
                </div>

                {!isCollapsed &&
                  group.actions.map((action) => (
                    <div
                      key={action.id}
                      className="flex flex-wrap items-center gap-3 px-4 py-3 pl-10"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-ink-muted">
                        {action.label}
                      </span>
                      <LevelPicker
                        label={action.label}
                        value={levels[action.id] ?? "none"}
                        onChange={(level) =>
                          setLevels((prev) => ({ ...prev, [action.id]: level }))
                        }
                      />
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          Cancel
        </button>
        {/* TODO: persist the matrix once the permissions API exists. */}
        <button
          type="button"
          className="inline-flex items-center rounded-lg bg-sidebar-active px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sidebar-active/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          Save Permission
        </button>
      </div>
    </div>
  );
}

function LevelPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AccessLevel;
  onChange: (level: AccessLevel) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={`${label} access level`}
      className="flex shrink-0 items-center gap-2"
    >
      {accessLevels.map((level) => {
        const selected = level.value === value;

        return (
          <button
            key={level.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(level.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
              selected
                ? "bg-sidebar-active text-white"
                : "text-ink-muted hover:bg-slate-100",
            )}
          >
            {level.label}
          </button>
        );
      })}
    </div>
  );
}
