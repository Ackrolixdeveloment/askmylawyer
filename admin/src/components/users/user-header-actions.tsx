"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Modal, type SelectOption } from "@/components/ui";
import { UserForm } from "./user-form";

interface UserHeaderActionsProps {
  roleOptions: SelectOption[];
  statusOptions: SelectOption[];
}

const actionClasses =
  "inline-flex items-center gap-2 rounded-lg bg-sidebar-active px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-sidebar-active/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none";

export function UserHeaderActions({
  roleOptions,
  statusOptions,
}: UserHeaderActionsProps) {
  const [open, setOpen] = useState<"user" | null>(null);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setOpen("user")}
          className={actionClasses}
        >
          <Plus className="size-[18px]" aria-hidden />
          Add User
        </button>
        {/* Roles are managed on their own screen. */}
        <Link href="/users/roles" className={actionClasses}>
          <Plus className="size-[18px]" aria-hidden />
          Add Role
        </Link>
      </div>

      {/* Keyed so each opening starts from a blank form. */}
      <Modal
        open={open === "user"}
        onClose={() => setOpen(null)}
        title="Add New User"
        description="Create a new user account for the system"
        className="max-w-2xl"
      >
        <UserForm
          key={open === "user" ? "user-open" : "user-closed"}
          roleOptions={roleOptions}
          statusOptions={statusOptions}
          onDone={() => setOpen(null)}
        />
      </Modal>

    </>
  );
}
