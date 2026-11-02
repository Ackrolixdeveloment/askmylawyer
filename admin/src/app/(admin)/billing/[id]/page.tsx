import { Topbar } from '@/components/layout/topbar';
import { LedgerDetail } from '@/components/billing/ledger-detail';
export const metadata={title:'Billing detail'};
export default async function Page({params}:PageProps<'/billing/[id]'>){const {id}=await params;return <><Topbar title="Billing detail"/><main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8"><LedgerDetail id={id}/></main></>;}
