"use client";
import { useState } from "react";
import { saveCustomer } from "@/lib/customers";
import { useAdmin } from "@/components/layout/auth-guard";
import { canChange } from "@/lib/auth";
import { Ban, MapPin } from "lucide-react";
import { Badge, Card, Modal, Button } from "@/components/ui";
import type { CustomerDetail } from "@/types/customer";

export function CustomerDetailHeader({
  customer,
  readOnly = false,
  onChanged,
}: {
  customer: CustomerDetail;
  readOnly?: boolean;
  onChanged?: () => void;
}) {
  const admin=useAdmin();const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  async function change(){setBusy(true);setError("");try{await saveCustomer(customer.id,{status:customer.status==="active"?"suspended":"active"});setOpen(false);onChanged?.();}catch(e){setError(e instanceof Error?e.message:"Could not update account.");}finally{setBusy(false);}}
  const action=customer.status==="active"?"Suspend":"Restore";
  const initials = customer.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="flex min-w-0 items-center gap-4">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-soft text-base font-semibold text-brand"
          aria-hidden
        >
          {initials}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold text-ink">
              {customer.name}
            </h1>
            <Badge tone={customer.status === "active" ? "success" : "danger"}>
              {customer.status === "active" ? "Active" : "Suspended"}
            </Badge>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
            <span>{customer.code}</span>
            {customer.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                {customer.city}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!readOnly && canChange(admin,"customers") && <><button onClick={()=>{setError("");setOpen(true);}} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs"><Ban className="size-4"/>{action}</button><Modal open={open} onClose={()=>{if(!busy)setOpen(false);}} title={`${action} ${customer.name}?`} description={customer.status==="active"?"This blocks app access and revokes existing sessions. Consultation and payment history are retained.":"This restores the customer's ability to sign in."} footer={<><Button variant="outline" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button><Button disabled={busy} onClick={change}>{busy?"Saving…":`${action} account`}</Button></>}>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}</Modal></>}

      </div>
    </Card>
  );
}
