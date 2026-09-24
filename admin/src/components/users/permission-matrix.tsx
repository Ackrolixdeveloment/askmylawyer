"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui";
import { ApiError } from "@/lib/api";
import {
  saveUserPermissions,
  type AccessLevel,
  type PermissionModule,
  type PermissionSet,
} from "@/lib/admin-users";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/types/user";

const levelLabels: Record<AccessLevel, string> = {
  none: "No Access",
  read: "Read Only",
  full: "Full Access",
};

interface PermissionMatrixProps {
  user: AdminUser;
  /** Modules and actions, as the backend defines them. */
  modules: PermissionModule[];
  levels: AccessLevel[];
  /** What this person can reach today. */
  permissions: PermissionSet;
}

export function PermissionMatrix({
  user,
  modules: permissionModules,
  levels: accessLevelValues,
  permissions,
}: PermissionMatrixProps) {
  const router = useRouter();
  const [levels, setLevels] = useState<PermissionSet>(permissions);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const accessLevels = accessLevelValues.map((value) => ({
    value,
    label: levelLabels[value],
  }));

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await saveUserPermissions(user.id, levels);
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not save these permissions.",
      );
    } finally {
      setSaving(false);
    }
  }

  /** A module level cascades to the actions nested under it. */
  function setModuleLevel(moduleId: string, level: AccessLevel) {
    const group = permissionModules.find((item) => item.id === moduleId);
    setSaved(false);

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
                    accessLevels={accessLevels}
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
                        accessLevels={accessLevels}
                        value={levels[action.id] ?? "none"}
                        onChange={(level) => {
                          setSaved(false);
                          setLevels((prev) => ({ ...prev, [action.id]: level }));
                        }}
                      />
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </Card>

      {error ? <p className="text-right text-sm text-negative">{error}</p> : null}
      {saved ? (
        <p className="text-right text-sm text-positive">
          Saved. {user.name} sees this the next time they sign in.
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center rounded-lg bg-sidebar-active px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sidebar-active/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Permission"}
        </button>
      </div>
    </div>
  );
}

function LevelPicker({
  label,
  value,
  accessLevels,
  onChange,
}: {
  label: string;
  value: AccessLevel;
  accessLevels: { value: AccessLevel; label: string }[];
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
