"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/user";

export function RoleForm({ roles }: { roles: Role[] }) {
  const router = useRouter();
  const groupName = useId();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const parent = roles.find((role) => role.id === parentId);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Give the role a name.");
      return;
    }
    setError("");
    // TODO: create the role through the admin API.
    router.push("/users");
  }

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="role-name" className="mb-1.5 block text-sm font-medium text-ink">
            Role Name
          </label>
          <input
            id="role-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter Role Name"
            aria-invalid={error ? true : undefined}
            className={cn(
              "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:ring-2 focus:outline-none",
              error
                ? "border-red-300 focus:border-negative focus:ring-red-100"
                : "border-line focus:border-brand focus:ring-brand/20",
            )}
          />
          {error ? (
            <p role="alert" className="mt-1.5 text-xs text-negative">
              {error}
            </p>
          ) : null}
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-ink">
            Parent Role / Primary Role
          </legend>
          <p className="mt-0.5 text-xs text-ink-muted">
            Select one parent role. Choose{" "}
            <span className="font-medium text-brand">None</span> if this is a
            top-level role.
          </p>

          <div className="mt-3 overflow-hidden rounded-xl border border-line">
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
              <RoleOption
                groupName={groupName}
                label="None"
                checked={parentId === null}
                onSelect={() => setParentId(null)}
                italic
              />

              {roles.map((role) => (
                <RoleOption
                  key={role.id}
                  groupName={groupName}
                  label={role.name}
                  checked={parentId === role.id}
                  onSelect={() => setParentId(role.id)}
                  showShield
                />
              ))}
            </div>

            <p className="border-t border-line bg-slate-50 px-4 py-2.5 text-xs text-ink-muted">
              {roles.length} roles total
            </p>
          </div>
        </fieldset>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <p className="text-sm text-ink-muted">
            {parent ? `Parent role: ${parent.name}` : "No parent role selected yet"}
          </p>
          <Button type="submit" className="bg-brand hover:bg-brand/90">
            Create Role
          </Button>
        </div>
      </form>
    </Card>
  );
}

function RoleOption({
  groupName,
  label,
  checked,
  onSelect,
  showShield = false,
  italic = false,
}: {
  groupName: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
  showShield?: boolean;
  italic?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
        checked
          ? "border-brand bg-brand-soft text-brand"
          : "border-line text-ink hover:bg-slate-50",
      )}
    >
      <input
        type="radio"
        name={groupName}
        checked={checked}
        onChange={onSelect}
        className="size-4 border-line text-brand focus:ring-2 focus:ring-brand/20"
      />
      {showShield ? (
        <ShieldCheck className="size-4 shrink-0 text-ink-subtle" aria-hidden />
      ) : null}
      <span className={cn("truncate", italic && "italic")}>{label}</span>
    </label>
  );
}
