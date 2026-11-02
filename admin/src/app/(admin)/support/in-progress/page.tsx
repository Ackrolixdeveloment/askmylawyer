import { Topbar } from '@/components/layout/topbar';
import { PageIntro } from '@/components/common/page-intro';
import { LiveSupportQueue } from '@/components/support/live-support-queue';
export const metadata={title:'Support in progress'};
export default function Page(){return <><Topbar title="Support in progress"/><main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8"><PageIntro title="Support in progress" description="Follow assigned, active and escalated support tickets."/><div className="mt-6"><LiveSupportQueue bucket="in-progress"/></div></main></>;}
