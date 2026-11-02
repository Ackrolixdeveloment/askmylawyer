import { PageIntro } from '@/components/common/page-intro';
import { Topbar } from '@/components/layout/topbar';
import { LedgerView } from '@/components/billing/ledger-view';
export const metadata={title:'Billing & payments'};
export default function Page(){return <><Topbar title="Billing & payments"/><main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8"><PageIntro title="Billing & payments" description="Consultation charges, extensions, refunds and recorded lawyer earnings."/><div className="mt-6"><LedgerView/></div></main></>;}
