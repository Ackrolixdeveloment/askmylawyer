"use client";

import Link from "next/link";
import { Eye, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/ui";
import { fetchConsultations, searchConsultationPeople, type ConsultationBucket, type ConsultationPage, type ConsultationPerson, type ConsultationRow } from "@/lib/consultations";
import { formatInr } from "@/lib/format";

type Filters = Record<string, string>;
const states = { scheduled: "Scheduled", searching: "Awaiting lawyer", assigned: "Waiting to join", active: "Ongoing", completed: "Completed", cancelled: "Cancelled", no_lawyer: "Unfulfilled", pending_payment: "Awaiting payment", refunded: "Refunded" };
const paymentLabels: Record<string, string> = { paid: "Paid", pending: "Pending", failed: "Failed", free: "Free", test: "Test booking", not_recorded: "Payment not recorded", refund_pending: "Refund pending", refunded: "Refunded", partially_refunded: "Partially refunded" };
const allDates = [{ key: "createdAt", header: "Booked on" }, { key: "scheduledFor", header: "Scheduled date" }, { key: "startedAt", header: "Session started" }, { key: "endedAt", header: "Session ended" }, { key: "submittedAt", header: "Report delivered on" }, { key: "refundRequestedAt", header: "Refund requested on" }, { key: "refundedAt", header: "Refund completed on" }];
function datesFor(bucket: ConsultationBucket) {
 const keys = bucket === "refunded" ? ["refundRequestedAt", "refundedAt", "createdAt"] : bucket === "scheduled" ? ["scheduledFor", "createdAt"] : bucket === "reports" ? ["endedAt", "createdAt"] : bucket === "completed" ? ["endedAt", "startedAt", "submittedAt", "createdAt"] : bucket === "in-progress" ? ["createdAt", "startedAt"] : bucket === "cancelled" ? ["createdAt", "startedAt", "endedAt"] : ["createdAt", "scheduledFor", "startedAt", "endedAt", "submittedAt"];
 return keys.map(key => allDates.find(d => d.key === key)!);
}

function modes(r: ConsultationRow) { return r.usedModes.length ? r.usedModes.map(v => v[0].toUpperCase() + v.slice(1)).join(" · ") : r.startedAt ? "Usage not recorded" : "—"; }
function sessionLabel(r: ConsultationRow) { return r.status === "assigned" && r.readyAt && new Date(r.readyAt).getTime() > Date.now() ? "Preparing" : states[r.status as keyof typeof states] ?? r.status; }
function cancellation(r: ConsultationRow) {
  if (r.status === "no_lawyer") return "No lawyer available";
  if (r.status !== "cancelled") return "";
  const actor = r.cancelledBy === "customer" ? "By customer" : r.cancelledBy === "lawyer" ? "By lawyer" : r.cancelledBy === "technical" ? "Technical issue" : r.cancelledBy === "system" ? "By system" : "Reason not recorded";
  return r.reason ? `${actor === "Reason not recorded" ? "" : actor + " · "}${r.reason}` : actor;
}
function moment(value: string) {
  const d = new Date(value);
  return <div className="whitespace-nowrap"><div>{d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" })}</div><div className="mt-1 text-xs text-ink-muted">{d.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })} IST</div></div>;
}
function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone === "positive" ? "bg-emerald-50 text-emerald-700" : tone === "negative" ? "bg-red-50 text-red-700" : tone === "pending" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{children}</span>;
}
function party(name: string | null, displayId: string | null, id: string | null, role: "customer" | "lawyer") {
  if (!id) return <span className="text-ink-muted">Unassigned</span>;
  return <Link href={role === "customer" ? `/customers/${id}` : `/lawyers/verified/${id}`} className="block max-w-48 hover:text-brand" title={id}><div className="font-semibold leading-5">{name ?? "Name not provided"}</div><div className="mt-1 font-mono text-xs text-ink-muted">{displayId ?? id.slice(0, 8).toUpperCase()}</div></Link>;
}
const columns: Column<ConsultationRow>[] = [
  { key: "consultationId", header: "Consultation / Type", filterable: false, sortValue: r => r.consultationId, textValue: r => `${r.consultationId} ${modes(r)}`, cell: r => <div className="min-w-32"><Link className="font-semibold text-brand" href={`/consultations/${r.id}`}>{r.consultationId}</Link><div className="mt-1 text-xs text-ink-muted" title={!r.mediaUsageKnown && r.usedModes.length ? "Only the recorded usage is shown; other historical usage is unknown." : undefined}>{modes(r)}</div></div> },
  { key: "customer", header: "Customer / ID", filterable: false, sortValue: r => r.customer, textValue: r => `${r.customer} ${r.customerDisplayId ?? ""}`, cell: r => party(r.customer, r.customerDisplayId, r.customerId, "customer") },
  { key: "lawyer", header: "Lawyer / ID", filterable: false, sortValue: r => r.lawyer ?? "", textValue: r => `${r.lawyer ?? "Unassigned"} ${r.lawyerDisplayId ?? ""}`, cell: r => party(r.lawyer, r.lawyerDisplayId, r.lawyerId, "lawyer") },
  { key: "slot", sortable: false, header: "Session / Booking (IST)", filterable: false, textValue: r => `${r.scheduledFor ?? r.startedAt ?? r.date} ${r.scheduledFor ? "Scheduled" : r.startedAt ? "Session" : "Booked"}`, cell: r => <div title={r.scheduledFor ? "Scheduled slot" : r.startedAt ? "Session started" : "Booking created"}>{moment(r.scheduledFor ?? r.startedAt ?? r.date)}<div className="mt-1 text-[10px] text-ink-muted">{r.scheduledFor ? "Scheduled" : r.startedAt ? "Session" : "Booked"}</div></div> },
  { key: "status", header: "Session status", filterable: false, sortValue: r => r.status, textValue: r => `${sessionLabel(r)} ${cancellation(r)}`, cell: r => <div className="min-w-32"><Badge tone={r.status === "completed" ? "positive" : r.status === "cancelled" || r.status === "no_lawyer" ? "negative" : "pending"}>{sessionLabel(r)}</Badge>{cancellation(r) && <p title={cancellation(r)} className="mt-1.5 max-w-44 text-xs leading-5 text-ink-muted">{cancellation(r)}</p>}</div> },
  { key: "payment", sortable: false, header: "Payment", filterable: false, textValue: r => `${r.collectedAmount === null ? "Collection unknown" : formatInr(r.collectedAmount) + " collected"} ${paymentLabels[r.paymentState]}`, cell: r => <div className="min-w-32"><div className="whitespace-nowrap font-semibold">{r.collectedAmount === null ? "—" : formatInr(r.collectedAmount)}{r.collectedAmount !== null && <span className="ml-1 text-[10px] font-normal text-ink-muted">collected</span>}</div><div className="mt-1.5"><Badge tone={r.paymentState === "paid" ? "positive" : r.paymentState === "pending" || r.paymentState === "refund_pending" ? "pending" : "neutral"}>{paymentLabels[r.paymentState] ?? "Payment not recorded"}</Badge></div>{r.refundStatus === "completed" && <p className="mt-1 text-xs text-ink-muted">{formatInr(r.refundAmount)} refunded</p>}</div> },
  { key: "report", sortable: false, header: "Report", filterable: false, textValue: r => r.reportState === "delivered" ? "Delivered" : r.reportState === "not_applicable" ? "Not applicable" : "Pending", cell: r => <div className="min-w-28"><Badge tone={r.reportState === "delivered" ? "positive" : r.reportState === "pending" ? "pending" : "neutral"}>{r.reportState === "delivered" ? "Delivered" : r.reportState === "not_applicable" ? "Not applicable" : "Pending"}</Badge>{r.reportState === "pending" && <p className="mt-1.5 text-xs text-ink-muted">{r.reportStatus === "failed" ? "Manual report required" : r.reportStatus === "awaiting_review" ? "Lawyer review" : r.reportStatus === "generating" ? "Preparing draft" : r.status === "completed" ? "Report not created" : r.status === "cancelled" ? "Review required" : "After session"}</p>}</div> },
  { key: "action", header: "Actions", cell: r => <Link href={`/consultations/${r.id}`} title="View details" aria-label={`View details ${r.consultationId}`} className="inline-flex size-9 items-center justify-center rounded-lg border border-line hover:bg-surface-subtle"><Eye className="size-4" /></Link> },
];

const refundLabels: Record<string, string> = { requested: "Requested", processing: "Processing", completed: "Completed", failed: "Retry / review required", needs_review: "Needs review" };
function columnsFor(bucket: ConsultationBucket): Column<ConsultationRow>[] {
 const result: Column<ConsultationRow>[] = columns.filter(c => bucket !== "refunded" || c.key !== "report").map(c => {
  if (c.key !== "slot") return c;
  const field = bucket === "scheduled" ? "scheduledFor" : bucket === "completed" || bucket === "reports" ? "endedAt" : "date";
  return { ...c, header: bucket === "scheduled" ? "Scheduled for (IST)" : bucket === "completed" || bucket === "reports" ? "Session ended (IST)" : "Booked on (IST)", cell: (r: ConsultationRow) => r[field] ? moment(r[field]!) : <span className="text-ink-muted">Not recorded</span>, textValue: (r: ConsultationRow) => r[field] ?? "Not recorded" };
 });
 if (bucket === "refunded") result.splice(result.findIndex(c => c.key === "action"), 0, { key: "refund", header: "Refund", sortable: false, filterable: false,
 textValue: r => `${formatInr(r.refundAmount)} ${refundLabels[r.refundStatus ?? "needs_review"]} Requested ${r.refundRequestedAt ?? "Not recorded"} Completed ${r.refundedAt ?? "Not completed"}`,
 cell: r => <div className="min-w-36"><p className="font-semibold">{formatInr(r.refundAmount)}</p>{r.reason && <p className="my-1 max-w-48 text-xs text-ink-muted">{r.reason}</p>}<Badge tone={r.refundStatus === "completed" ? "positive" : "pending"}>{refundLabels[r.refundStatus ?? "needs_review"]}</Badge><p className="mt-2 text-[10px] text-ink-muted">Requested</p>{r.refundRequestedAt ? moment(r.refundRequestedAt) : <p className="text-xs text-ink-muted">Not recorded</p>}{r.refundedAt && <><p className="mt-2 text-[10px] text-ink-muted">Completed</p>{moment(r.refundedAt)}</>}</div> });
 return result;
}

function PersonLookup({ role, selected, onChange }: { role: "customer" | "lawyer"; selected?: ConsultationPerson; onChange: (person?: ConsultationPerson) => void }) {
  const [query, setQuery] = useState(""); const [rows, setRows] = useState<ConsultationPerson[]>([]); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    if (query.trim().length < 2 || selected) return;
    const timer = setTimeout(() => { setLoading(true); setError(""); searchConsultationPeople(role, query.trim()).then(data => { if (!cancelled) setRows(data.data); }).catch(() => { if (!cancelled) setError("Could not search. Please retry."); }).finally(() => { if (!cancelled) setLoading(false); }); }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, role, selected]);
  return <fieldset><legend className="mb-2 text-xs font-bold capitalize text-ink-muted">{role}</legend>{selected ? <div className="flex items-center justify-between gap-2 rounded-lg bg-brand-soft p-2 text-xs"><span>{selected.name}<small className="block font-mono">{selected.displayId}</small></span><button aria-label={`Clear ${role} filter`} onClick={() => { onChange(); setQuery(""); setRows([]); }}><X className="size-4" /></button></div> : <><div className="relative"><Search className="absolute left-2.5 top-2.5 size-3.5 text-ink-muted" /><input aria-label={`Find ${role}`} placeholder="Type name, ID, phone or email…" value={query} onChange={e => { setQuery(e.target.value); setRows([]); }} className="w-full rounded-lg border border-line py-2 pl-8 pr-2 text-xs" /></div>{query.trim().length >= 2 && <div role="listbox" aria-label={`${role} results`} className="mt-1 max-h-36 overflow-y-auto rounded-lg border border-line">{loading ? <p className="p-2 text-xs">Searching…</p> : error ? <p className="p-2 text-xs text-negative">{error}</p> : rows.length ? rows.map(row => <button role="option" aria-selected={false} key={row.id} onClick={() => { onChange(row); setRows([]); }} className="block w-full p-2 text-left text-xs hover:bg-brand-soft"><span>{row.name}</span><span className="ml-2 font-mono text-ink-muted">{row.displayId}</span></button>) : <p className="p-2 text-xs text-ink-muted">No matches.</p>}</div>}</>}</fieldset>;
}
const filterOptions: [string, string, [string, string][]][] = [
  ["status", "Session status", [["searching", "Awaiting lawyer"], ["preparing", "Preparing"], ["waiting", "Waiting to join"], ["active", "Ongoing"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["no_lawyer", "Unfulfilled"], ["scheduled", "Scheduled"], ["pending_payment", "Awaiting payment"]]],
  ["medium", "Communication mode", [["audio", "Audio"], ["video", "Video"], ["chat", "Chat"], ["unknown", "Usage not recorded"]]],
  ["bookingMode", "Booking mode", [["instant", "Instant"], ["scheduled", "Scheduled"]]],
  ["paymentState", "Payment", Object.entries(paymentLabels)],
  ["reportState", "Report", [["pending", "Pending"], ["delivered", "Delivered"], ["not_applicable", "Not applicable"]]],
  ["cancelledBy", "Cancellation by", [["customer", "Customer"], ["lawyer", "Lawyer"], ["system", "System"], ["technical", "Technical issue"], ["unknown", "Not recorded"]]],
  ["assignment", "Lawyer assignment", [["assigned", "Assigned"], ["unassigned", "Unassigned"]]],
];
export function ConsultationQueue({ bucket, customerId }: { bucket: ConsultationBucket; customerId?: string }) {
  const dateFields = datesFor(bucket);
  const queueColumns = columnsFor(bucket);
  const queueFilters = filterOptions.map(([key, label, options]): [string, string, [string, string][]] => [key, label, key === "status" && bucket === "in-progress" ? options.filter(([value]) => ["searching", "preparing", "waiting", "active"].includes(value)) : key === "status" && bucket === "cancelled" ? options.filter(([value]) => ["cancelled", "no_lawyer"].includes(value)) : options]).filter(([key]) => !((key === "status" && ["scheduled", "reports", "completed"].includes(bucket)) || (key === "bookingMode" && bucket === "scheduled") || (key === "reportState" && ["reports", "refunded", "scheduled", "in-progress"].includes(bucket)) || (key === "cancelledBy" && !["all", "cancelled"].includes(bucket))));
  const [filters, setFilters] = useState<Filters>({}); const [customer, setCustomer] = useState<ConsultationPerson>(); const [lawyer, setLawyer] = useState<ConsultationPerson>();
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [size, setSize] = useState(10);
  const [dates, setDates] = useState({ dateField: datesFor(bucket)[0].key, from: "", to: "" }); const [sort, setSort] = useState({ sortBy: "date", direction: "desc" });
  const [data, setData] = useState<ConsultationPage>(); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [reload, setReload] = useState(0);
  const query = useMemo(() => ({ ...filters, ...dates, ...sort, customerId: customer?.id ?? customerId, lawyerId: lawyer?.id, search }), [filters, dates, sort, customer, customerId, lawyer, search]);
  useEffect(() => {
    let cancelled = false;
    fetchConsultations(bucket, { ...query, page, perPage: size }).then(result => { if (!cancelled) { setData(result); setError(""); if (!result.data.length && result.total && page > 1) setPage(1); } }).catch(() => { if (!cancelled) setError("Could not load consultations. Please retry."); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bucket, query, page, size, reload]);
  const searchChanged = useCallback((value: string) => { setSearch(value); setPage(1); }, [setSearch, setPage]);
  const dateChanged = useCallback((dateField: string, from: string, to: string) => { setDates(prev => prev.dateField === dateField && prev.from === from && prev.to === to ? prev : { dateField, from, to }); setPage(1); }, [setPage, setDates]);
  const sortChanged = useCallback((sortBy: string, direction: "asc" | "desc") => { setSort(prev => prev.sortBy === sortBy && prev.direction === direction ? prev : { sortBy, direction }); setPage(1); }, [setPage, setSort]);
  function reset() { setFilters({}); setCustomer(undefined); setLawyer(undefined); setPage(1); }
  const updateFilter = (key: string, value: string) => { setFilters(prev => ({ ...prev, [key]: value })); setPage(1); };
  async function exportAll() {
    const first = await fetchConsultations(bucket, { ...query, page: 1, perPage: 500 }); const rows = [...first.data];
    for (let index = 2; rows.length < first.total; index++) { const next = await fetchConsultations(bucket, { ...query, page: index, perPage: 500 }); if (!next.data.length) break; rows.push(...next.data); }
    return rows;
  }
  return <div aria-busy={loading}>{customerId && <div className="mb-3 text-xs text-ink-muted">Customer {customerId.slice(0, 8).toUpperCase()} · <Link className="text-brand underline" href={`/consultations/${bucket}`}>Clear customer filter</Link></div>}{error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error} <button className="underline" onClick={() => setReload(v => v + 1)}>Retry</button></p>}
    <DataTable columns={queueColumns} rows={data?.data ?? []} getRowId={r => r.id} minWidth={bucket === "refunded" ? 1350 : 1100} defaultSort={{ key: "date", direction: "desc" }} totalCount={data?.bucketTotal ?? 0} totalLabel="Total consultations" selectable={false}
      emptyMessage={loading ? "Loading consultations…" : "No matching consultations."}
      filterContent={<div className="space-y-4"><PersonLookup role="customer" selected={customer} onChange={person => { setCustomer(person); setPage(1); }} /><PersonLookup role="lawyer" selected={lawyer} onChange={person => { setLawyer(person); setPage(1); }} />{queueFilters.map(([key, label, options]) => <label key={key} className="block text-xs font-semibold text-ink-muted">{label}<select aria-label={label} value={filters[key] ?? ""} onChange={e => updateFilter(key, e.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-white p-2 text-xs font-normal text-ink"><option value="">All</option>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>)}{bucket === "refunded" && <label className="block text-xs font-semibold text-ink-muted">Refund status<select aria-label="Refund status" value={filters.refundStatus ?? ""} onChange={e => updateFilter("refundStatus", e.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-white p-2 text-xs"><option value="">All</option>{Object.entries(refundLabels).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>}{bucket === "reports" && <label className="block text-xs font-semibold text-ink-muted">Report stage<select aria-label="Report stage" value={filters.reportStage ?? ""} onChange={e => updateFilter("reportStage", e.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-white p-2 text-xs"><option value="">All pending stages</option><option value="missing">Report not created</option><option value="generating">Preparing draft</option><option value="awaiting_review">Lawyer review</option><option value="failed">Manual report required</option></select></label>}</div>}
      serverSide={{ page, pageSize: size, total: data?.total ?? 0, filterCount: Object.values(filters).filter(Boolean).length + Number(Boolean(customer)) + Number(Boolean(lawyer)), dateFields,
        onPageChange: setPage, onPageSizeChange: value => { setSize(value); setPage(1); }, onSearchChange: searchChanged, onDateChange: dateChanged, onSortChange: sortChanged, onResetFilters: reset, exportRows: exportAll }} />
  </div>;
}
