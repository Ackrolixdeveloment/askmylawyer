import { api } from './api';
export interface LedgerRow {
 id:string;requestId:string;consultationId:string;kind:string;customer:string;customerId:string;lawyer:string;lawyerId:string|null;lawyerDisplayId:string|null;planName:string;sessionStatus:string;amount:number;gst:number;environment:string;provider:string;status:string;test:boolean;collected:number|null;refunded:number;refundRequested:number;refundStatus:string|null;refundReason:string|null;orderId:string|null;reference:string|null;method:string|null;failureReason:string|null;date:string;paidAt:string|null;refundedAt:string|null;
 earning:{gross:number;commission:number;net:number;status:string;heldReason:string|null;paidOutAt:string|null}|null;
}
export interface LedgerPage {data:LedgerRow[];total:number;totalRecords:number;summary:{collected:number;refunded:number;testRecords:number};page:number;perPage:number;}
export function fetchLedger(filters:Record<string,string|number|undefined>={}){const q=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v!==undefined&&v!=='')q.set(k,String(v));});return api<LedgerPage>(`/admin/billing?${q}`);}
export const fetchLedgerRecord=(id:string)=>api<LedgerRow>(`/admin/billing/${encodeURIComponent(id)}`);
