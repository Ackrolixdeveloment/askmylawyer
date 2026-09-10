"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Button,
  Card,
  FilterSelect,
  TextField,
  type SelectOption,
} from "@/components/ui";

interface UserFormProps {
  roleOptions: SelectOption[];
  statusOptions: SelectOption[];
  /**
   * Supplied when the form is shown in a dialog: the surrounding Card is
   * dropped and this runs instead of navigating away.
   */
  onDone?: () => void;
}

export function UserForm({ roleOptions, statusOptions, onDone }: UserFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("active");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !phone.trim() || !role) {
      setError("Fill in every required field.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Both passwords must match.");
      return;
    }

    setError("");
    // TODO: create the user through the admin API.
    if (onDone) {
      onDone();
      return;
    }
    router.push("/users");
  }

  const body = (
    <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="Full Name *"
          placeholder="Enter full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          label="Email Address *"
          type="email"
          autoComplete="email"
          placeholder="Enter email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Phone Number *"
          inputMode="numeric"
          placeholder="Enter phone number"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Role *</p>
          <FilterSelect
            size="sm"
            aria-label="Role"
            options={roleOptions}
            value={role}
            onChange={setRole}
          />
        </div>

        <TextField
          label="Password *"
          reveal
          autoComplete="new-password"
          placeholder="Enter password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <TextField
          label="Confirm Password *"
          reveal
          autoComplete="new-password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={error || undefined}
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Status</p>
          <FilterSelect
            size="sm"
            aria-label="Status"
            options={statusOptions}
            value={status}
            onChange={setStatus}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => (onDone ? onDone() : router.push("/users"))}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-sidebar-active hover:bg-sidebar-active/90"
          >
            Create User
          </Button>
        </div>
      </form>
  );

  // In a dialog the surrounding panel already provides the card chrome.
  return onDone ? body : <Card className="p-5 sm:p-6">{body}</Card>;
}
