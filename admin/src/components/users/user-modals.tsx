"use client";

import { useState } from "react";
import { FilterSelect, Modal, TextField } from "@/components/ui";
import { roles, statusFilterOptions } from "@/data/mock-users";
import type { AdminUser } from "@/types/user";

const statusChoices = statusFilterOptions.filter(
  (option) => option.value !== "all",
);

/** Roles are picked by name — that is what the row stores. */
const roleChoices = roles.map((role) => ({
  value: role.name,
  label: role.name,
}));

interface UserModalProps {
  user: AdminUser | null;
  onClose: () => void;
}

/**
 * Edit dialog. Fields are local state only — there is no users API yet, so
 * "Save Changes" just closes the dialog.
 */
export function EditUserModal({ user, onClose }: UserModalProps) {
  return user ? <EditUserForm user={user} onClose={onClose} /> : null;
}

/** Keyed by user id from the caller, so each row opens a fresh form. */
function EditUserForm({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);

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
          {/* TODO: persist via the users API once it exists. */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-w-40 items-center justify-center rounded-lg bg-sidebar-active px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sidebar-active/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            Save Changes
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
          <FilterSelect
            options={roleChoices}
            value={role}
            onChange={setRole}
            aria-label="Role"
            size="sm"
          />
        </div>
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
