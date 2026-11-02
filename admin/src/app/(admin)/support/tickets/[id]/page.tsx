import { Topbar } from '@/components/layout/topbar';
import { LiveSupportDetail } from '@/components/support/live-support-detail';
export const metadata={title:'Support ticket'};
export default async function Page({params}:PageProps<'/support/tickets/[id]'>){const {id}=await params;return <><Topbar title="Support ticket"/><main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8"><LiveSupportDetail id={id}/></main></>;}
