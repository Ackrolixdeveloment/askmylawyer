import { api } from "./api";
import type { CustomerStatus } from "@/types/customer";

export interface CustomerRow {
  id: string;
  name: string;
  contact: string;
  city: string;
  joinedOn: string;
  consults: number;
  lastActiveOn: string | null;
  status: CustomerStatus;
}

export interface CustomerMetrics {
  total: number;
  active: number;
  newRegistrations: number;
  suspended: number;
}

export interface CustomerPage {
  data: CustomerRow[];
  total: number;
  page: number;
  perPage: number;
}

export interface CustomerPersonal {
  fullName: string | null;
  email: string | null;
  mobile: string | null;
  gender: string | null;
  ageBand: string | null;
  languages: string[];
  maritalStatus: string | null;
  occupation: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  address: string | null;
}

export interface CustomerConsultation {
  id: string;
  reference: string;
  lawyer: string | null;
  category: string | null;
  planName: string;
  date: string;
  status: string;
  amount: number;
  refunded: boolean;
}

export interface CustomerTransaction {
  id: string;
  type: "Debit" | "Credit";
  amount: number;
  method: string;
  date: string;
  reference: string;
}

export interface CustomerRefund {
  id: string;
  reason: string;
  amount: number;
  requestedOn: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  status: CustomerStatus;
  city: string;
  personal: CustomerPersonal;
  joinedOn: string;
  consultationTotal: number;
  consultations: CustomerConsultation[];
  transactions: CustomerTransaction[];
  refunds: CustomerRefund[];
  /** No referral module yet; always null for now. */
  referral: null;
  /** No support module yet; always empty for now. */
  supportTickets: never[];
}

export interface CustomerFilters {
  search?: string;
  status?: CustomerStatus;
  page?: number;
  perPage?: number;
}

export function fetchCustomerMetrics() {
  return api<CustomerMetrics>("/admin/customers/metrics");
}

export function fetchCustomers(filters: CustomerFilters = {}) {
  const query = new URLSearchParams();
  if (filters.search) query.set("search", filters.search);
  if (filters.status) query.set("status", filters.status);
  if (filters.page) query.set("page", String(filters.page));
  if (filters.perPage) query.set("perPage", String(filters.perPage));

  const suffix = query.toString();
  return api<CustomerPage>(`/admin/customers${suffix ? `?${suffix}` : ""}`);
}

export function fetchCustomer(id: string) {
  return api<CustomerRecord>(`/admin/customers/${id}`);
}

export function saveCustomer(id: string, changes: Partial<CustomerPersonal & { status: CustomerStatus }>) {
  return api<CustomerRecord>(`/admin/customers/${id}`, { method: "PUT", body: changes });
}

export function deleteCustomer(id: string) {
  return api<{ deleted: boolean }>(`/admin/customers/${id}`, { method: "DELETE" });
}
