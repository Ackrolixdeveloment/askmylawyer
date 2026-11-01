"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchUserPermissions } from "@/lib/admin-users";
import { useApiData } from "@/lib/use-api-data";
import { ScreenState } from "@/components/common/screen-state";
export function LegacyUserPermissions({ id }: { id: string }) {
  const router = useRouter();
  const { data, loading, error, retry } = useApiData(
    () => fetchUserPermissions(id),
    [id],
  );
  useEffect(() => {
    if (data) router.replace(`/users/roles/${data.user.roleId}/permissions`);
  }, [data, router]);
  return (
    <ScreenState loading={loading} error={error} onRetry={retry}>
      <p className="text-sm text-ink-muted">
        Access is inherited from the assigned role. Opening role permissions…
      </p>
    </ScreenState>
  );
}
