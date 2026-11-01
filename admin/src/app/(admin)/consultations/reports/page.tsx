import { Topbar } from "@/components/layout/topbar";
import { PageIntro } from "@/components/common/page-intro";
import { ConsultationQueue } from "@/components/consultations/consultation-queue";
export const metadata = { title: "Reports pending" };
export default function Page() { return <><Topbar title="Reports pending" /><main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8"><PageIntro title="Reports pending" description="Transcription, AI drafting, manual fallback and lawyer review." /><div className="mt-6"><ConsultationQueue bucket="reports" /></div></main></>; }
