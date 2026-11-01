"use client";

import { useMemo } from "react";
import { ScreenState } from "@/components/common/screen-state";
import { CustomersTable } from "@/components/customers/customers-table";
import { fetchCustomers } from "@/lib/customers";
import { useApiData } from "@/lib/use-api-data";
import type { Customer } from "@/types/customer";

/**
 * "2026-10-21T09:03:34.083Z" -> "2026-10-21".
 *
 * The table's date helpers split on "-", so a full timestamp parses as an
 * invalid date. The API sends timestamps; the table wants days.
 */

/** Everyone who has registered through the app. */
export function CustomersView() {
  const load = useMemo(
    () => () =>
      (async () => {
        const first = await fetchCustomers({ perPage: 100 });
        const rows = [...first.data];
        for (let page = 2; rows.length < first.total; page++) {
          const next = await fetchCustomers({ perPage: 100, page });
          if (!next.data.length) break;
          rows.push(...next.data);
        }
        return { ...first, data: rows };
      })(),
    [],
  );
  const { data, loading, error, retry } = useApiData(load);

  const page = data;
  const rows: Customer[] = (page?.data ?? []).map((row) => ({
    ...row,
    id: row.id,
    name: row.name,
    contact: row.contact,
    city: row.city,
    joinedOn: row.joinedOn,
    consults: row.consults,
    lastActiveOn: row.lastActiveOn,
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
        <CustomersTable customers={rows} />
      </div>
    </ScreenState>
  );
}
