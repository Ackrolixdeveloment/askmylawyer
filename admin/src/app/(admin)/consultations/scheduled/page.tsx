import { Topbar } from "@/components/layout/topbar";
import { PageIntro } from "@/components/common/page-intro";
import { ConsultationQueue } from "@/components/consultations/consultation-queue";
export const metadata = { title: "Scheduled consultations" };
export default function Page() { return <><Topbar title="Scheduled consultations" /><main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8"><PageIntro title="Scheduled consultations" description="Upcoming bookings waiting for their scheduled matching window." /><div className="mt-6"><ConsultationQueue bucket="scheduled" /></div></main></>; }
