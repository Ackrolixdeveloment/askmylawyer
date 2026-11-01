import { redirect } from "next/navigation";

/** Retired: per-lawyer edit history will live on the lawyer detail screen. */
export default function RetiredEditHistoryPage() {
  redirect("/lawyers/edit-approvals/pending");
}
