import { Topbar } from "@/components/layout/topbar";
import { PageIntro } from "@/components/common/page-intro";
import { ConsultationQueue } from "@/components/consultations/consultation-queue";
export const metadata = { title: "All consultations" };
export default function Page() { return <><Topbar title="All consultations" /><main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8"><PageIntro title="All consultations" description="Bookings, matching, sessions, payments and report status." /><div className="mt-6"><ConsultationQueue bucket="all" /></div></main></>; }
