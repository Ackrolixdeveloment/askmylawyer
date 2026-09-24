"use client";

import { useState } from "react";
import { FilterSelect, Modal, TextField } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { updateAdminUser } from "@/lib/admin-users";
import type { AdminUser, Role } from "@/types/user";

interface UserModalProps {
  user: AdminUser | null;
  onClose: () => void;
}

interface EditUserModalProps extends UserModalProps {
  roles: Role[];
  /** Reloads the table once the change is saved. */
  onSaved: () => void;
}

const statusChoices = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function EditUserModal({ user, roles, onClose, onSaved }: EditUserModalProps) {
  return user ? (
    <EditUserForm user={user} roles={roles} onClose={onClose} onSaved={onSaved} />
  ) : null;
}

/** Keyed by user id from the caller, so each row opens a fresh form. */
function EditUserForm({
  user,
  roles,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [roleId, setRoleId] = useState(user.roleId);
  const [status, setStatus] = useState(user.status);
  /** Left blank unless the admin is setting a new one. */
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Built-in roles are not on offer: only one person can be Super Admin.
  const roleOptions = roles
    .filter((item) => !item.isSystem)
    .map((item) => ({ value: item.id, label: item.name }));

  async function save() {
    if (password && password.length < 8) {
      setError("The new password needs at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Both passwords must match.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateAdminUser(user.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        // Left out for a Super Admin — theirs is fixed.
        ...(user.isSystemRole ? {} : { roleId }),
        // Only sent when a new one was typed; otherwise it stays as it is.
        ...(password ? { password } : {}),
        status,
      });
      onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not save this user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit user"
      className="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-w-32 items-center justify-center rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex min-w-40 items-center justify-center rounded-lg bg-sidebar-active px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sidebar-active/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Full Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          label="Email Address"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Phone Number"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">Role</span>
          {user.isSystemRole ? (
            <p className="rounded-lg border border-line bg-slate-50 px-3.5 py-2.5 text-sm text-ink-muted">
              {user.role} — this role cannot be changed
            </p>
          ) : (
            <FilterSelect
              options={roleOptions}
              value={roleId}
              onChange={setRoleId}
              aria-label="Role"
              size="sm"
            />
          )}
        </div>
        <TextField
          label="New Password"
          type="password"
          value={password}
          autoComplete="new-password"
          placeholder="Leave blank to keep the current one"
          onChange={(event) => setPassword(event.target.value)}
        />
        <TextField
          label="Confirm New Password"
          type="password"
          value={confirm}
          autoComplete="new-password"
          placeholder="Repeat the new password"
          onChange={(event) => setConfirm(event.target.value)}
        />

        {error ? (
          <p className="text-sm text-negative sm:col-span-2">{error}</p>
        ) : null}

        {/* Audit dates are set by the backend. */}
        <TextField label="Created At" value={user.createdAt} readOnly />
        <TextField label="Last Updated" value={user.lastUpdated} readOnly />
        <TextField label="User ID" value={user.employeeCode} readOnly />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Status
          </span>
          <FilterSelect
            options={statusChoices}
            value={status}
            onChange={(value) => setStatus(value as AdminUser["status"])}
            aria-label="Status"
            size="sm"
          />
        </div>
      </div>
    </Modal>
  );
}

/** Read-only twin of the edit dialog. */
export function ViewUserModal({ user, onClose }: UserModalProps) {
  if (!user) return null;

  const rows: [string, string][] = [
    ["Full Name", user.name],
    ["Email Address", user.email],
    ["Phone Number", user.phone],
    ["Role", user.role],
    ["Created At", user.createdAt],
    ["Last Updated", user.lastUpdated],
    ["User ID", user.employeeCode],
    ["Status", user.status === "active" ? "Active" : "Inactive"],
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title="View user"
      className="max-w-2xl"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-w-32 items-center justify-center rounded-lg bg-sidebar-active px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sidebar-active/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          Close
        </button>
      }
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="mb-1.5 text-sm font-medium text-ink">{label}</dt>
            <dd className="rounded-lg border border-line bg-slate-50 px-3.5 py-2.5 text-sm text-ink-muted">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
