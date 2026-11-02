import { Topbar } from '@/components/layout/topbar';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
export const metadata={title:'Dashboard | Ask My Lawyer Admin'};
export default function Page(){return <><Topbar title="Dashboard"/><main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8"><DashboardOverview/></main></>;}
