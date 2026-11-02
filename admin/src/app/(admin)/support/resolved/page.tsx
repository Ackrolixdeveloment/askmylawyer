import { Topbar } from '@/components/layout/topbar';
import { PageIntro } from '@/components/common/page-intro';
import { LiveSupportQueue } from '@/components/support/live-support-queue';
export const metadata={title:'Resolved support tickets'};
export default function Page(){return <><Topbar title="Resolved support tickets"/><main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8"><PageIntro title="Resolved support tickets" description="Review resolutions and closed support conversations."/><div className="mt-6"><LiveSupportQueue bucket="resolved"/></div></main></>;}
