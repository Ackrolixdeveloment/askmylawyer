"use client";

import { BarChart3, TrendingUp, UserRoundSearch } from "lucide-react";
import { useMemo } from "react";
import { MetricCards } from "@/components/common/metric-cards";
import { ScreenState } from "@/components/common/screen-state";
import { CustomersTable } from "@/components/customers/customers-table";
import { fetchCustomerMetrics, fetchCustomers } from "@/lib/customers";
import { useApiData } from "@/lib/use-api-data";
import type { Customer } from "@/types/customer";

/** Everyone who has registered through the app. */
export function CustomersView() {
  const load = useMemo(
    () => () => Promise.all([fetchCustomerMetrics(), fetchCustomers({ perPage: 100 })]),
    [],
  );
  const { data, loading, error, retry } = useApiData(load);

  const [metrics, page] = data ?? [];

  const cards = [
    {
      id: "total",
      label: "Total Customers",
      value: metrics?.total ?? 0,
      tone: "brand",
      icon: UserRoundSearch,
    },
    {
      id: "active",
      label: "Active Customers",
      value: metrics?.active ?? 0,
      tone: "positive",
      icon: TrendingUp,
    },
    {
      id: "new",
      label: "New Registrations",
      value: metrics?.newRegistrations ?? 0,
      tone: "brand",
      icon: BarChart3,
    },
    {
      id: "suspended",
      label: "Suspended",
      value: metrics?.suspended ?? 0,
      tone: "negative",
      icon: BarChart3,
    },
  ] as const;

  // The table was written against the mock shape; a customer who has never
  // signed in has no last-active date, so it falls back to the join date
  // rather than rendering an empty cell.
  const rows: Customer[] = (page?.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    contact: row.contact,
    city: row.city,
    joinedOn: row.joinedOn,
    consults: row.consults,
    lastActiveOn: row.lastActiveOn ?? row.joinedOn,
    status: row.status,
  }));

  return (
    <ScreenState
      loading={loading}
      error={error}
      onRetry={retry}
      loadingLabel="Loading customers…"
    >
      <div className="mt-6 space-y-4">
        <MetricCards metrics={cards} />
        <CustomersTable customers={rows} />
      </div>
    </ScreenState>
  );
}
