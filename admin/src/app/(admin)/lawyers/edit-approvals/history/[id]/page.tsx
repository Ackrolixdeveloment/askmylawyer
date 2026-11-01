import { redirect } from "next/navigation";

export default async function RetiredEditHistoryProfilePage({
  params,
}: PageProps<"/lawyers/edit-approvals/history/[id]">) {
  const { id } = await params;
  redirect(`/lawyers/verified/${id}`);
}
