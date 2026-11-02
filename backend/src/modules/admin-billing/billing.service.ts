import { Injectable, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AppException } from '../../common/app-exception';
import { BillingQuery } from './billing.dto';

// Read-only ledger: no gateway sessions, bank payloads or credentials leave this projection.
export const ledger = Prisma.sql`WITH ledger AS (
 SELECT 'consultation_' || r.id::text AS id, r.id AS request_id, r.number, 'consultation' AS kind,
 r.customer_id, r.lawyer_id, r.plan_name, r.status::text AS session_status,
 COALESCE(p.amount,r.amount) AS amount, COALESCE(p.gst,r.gst) AS gst,
 CASE WHEN r.payment_bypassed OR p.provider='bypass' OR p.method='bypass' OR p.reference='BYPASS-NO-PAYMENT-TAKEN' THEN 'bypass' ELSE CASE WHEN p.environment::text='production' THEN 'live' ELSE COALESCE(p.environment::text,'unknown') END END AS environment,
 COALESCE(p.provider,CASE WHEN r.payment_bypassed THEN 'bypass' ELSE 'unknown' END) AS provider,
 CASE WHEN p.refund_status='completed' THEN 'refunded' WHEN p.refund_status IS NOT NULL THEN 'refund_pending' WHEN p.status::text IN ('paid','refunded') THEN 'paid' WHEN p.status::text='failed' THEN 'failed' WHEN p.status::text='created' OR r.status::text='pending_payment' THEN 'pending' WHEN r.amount=0 AND p.id IS NULL THEN 'free' ELSE 'not_recorded' END AS status,
 CASE WHEN p.status::text IN ('paid','refunded') THEN p.amount WHEN p.id IS NULL AND r.amount>0 AND NOT r.payment_bypassed THEN NULL ELSE 0 END AS collected,
 CASE WHEN p.refund_status='completed' THEN COALESCE(p.refund_amount,0) ELSE 0 END AS refunded,
 COALESCE(p.refund_amount,0) AS refund_requested, p.refund_status::text, p.refund_reason,
 p.order_id, p.reference, p.method, p.failure_reason, COALESCE(p.created_at,r.created_at) AS date, p.paid_at, p.refunded_at,
 e.gross, e.commission, e.net, e.status::text AS earning_status, e.held_reason, e.paid_out_at,
 c.full_name AS customer, l.full_name AS lawyer, l.lawyer_number
 FROM consultation_requests r LEFT JOIN consultation_payments p ON p.request_id=r.id LEFT JOIN lawyer_earnings e ON e.request_id=r.id
 JOIN users c ON c.id=r.customer_id LEFT JOIN users l ON l.id=r.lawyer_id
 UNION ALL
 SELECT 'extension_' || x.id::text, r.id, r.number, 'extension',r.customer_id,r.lawyer_id,r.plan_name,r.status::text,x.amount,0,
 CASE WHEN x.environment::text='production' THEN 'live' ELSE COALESCE(x.environment::text,CASE WHEN r.payment_bypassed THEN 'bypass' ELSE 'unknown' END) END,CASE WHEN x.order_id IS NOT NULL THEN 'razorpay' WHEN r.payment_bypassed THEN 'bypass' ELSE 'unknown' END,
 CASE WHEN x.refund_status='completed' THEN 'refunded' WHEN x.refund_status IS NOT NULL THEN 'refund_pending' WHEN x.paid_at IS NOT NULL THEN 'paid' ELSE 'pending' END,
 CASE WHEN x.paid_at IS NOT NULL THEN x.amount ELSE 0 END,
 CASE WHEN x.refund_status='completed' THEN x.amount ELSE 0 END,
 CASE WHEN x.refund_status IS NOT NULL THEN x.amount ELSE 0 END,x.refund_status::text,NULL,
 x.order_id,x.reference,NULL,NULL,x.created_at,x.paid_at,NULL,
 NULL,NULL,NULL,NULL,NULL,NULL,c.full_name,l.full_name,l.lawyer_number
 FROM consultation_extensions x JOIN consultation_requests r ON r.id=x.request_id JOIN users c ON c.id=r.customer_id LEFT JOIN users l ON l.id=r.lawyer_id
 WHERE x.amount>0 AND (x.order_id IS NOT NULL OR x.paid_at IS NOT NULL OR x.refund_status IS NOT NULL)
)`;
export function billingFilters(q: BillingQuery) {
 const clauses: Prisma.Sql[] = [Prisma.sql`TRUE`];
 if(q.kind) clauses.push(Prisma.sql`kind=${q.kind}`);
 if(q.status) clauses.push(Prisma.sql`status=${q.status}`);
 if(q.environment) clauses.push(Prisma.sql`environment=${q.environment}`);
 if(q.provider) clauses.push(Prisma.sql`provider=${q.provider}`);
 if(q.search){const term='%'+q.search+'%'; clauses.push(Prisma.sql`(customer ILIKE ${term} OR lawyer ILIKE ${term} OR customer_id::text ILIKE ${term} OR lawyer_id::text ILIKE ${term} OR ('LAW'||lpad(lawyer_number::text,GREATEST(4,length(lawyer_number::text)),'0')) ILIKE ${term} OR ('AML-'||lpad(number::text,GREATEST(6,length(number::text)),'0')) ILIKE ${term} OR order_id ILIKE ${term} OR reference ILIKE ${term})`);}
 const field=q.dateField==='paidAt'?Prisma.sql`paid_at`:q.dateField==='refundedAt'?Prisma.sql`refunded_at`:Prisma.sql`date`;
 function day(value:string,end=false){const d=new Date(value+'T00:00:00+05:30');if(!Number.isFinite(d.getTime())||new Date(d.getTime()+19800000).toISOString().slice(0,10)!==value)throw new AppException(HttpStatus.BAD_REQUEST,'INVALID_DATE','Choose a valid calendar date.');return new Date(d.getTime()+(end?86400000:0));}
 if(q.from&&q.to&&q.from>q.to)throw new AppException(HttpStatus.BAD_REQUEST,'INVALID_DATE_RANGE','End date must follow the start date.');
 if(q.from)clauses.push(Prisma.sql`${field} >= ${day(q.from)}`);
 if(q.to)clauses.push(Prisma.sql`${field} < ${day(q.to,true)}`);
 return Prisma.join(clauses,' AND ');
}
@Injectable()
export class BillingService {
 constructor(private readonly prisma:PrismaService){}
 async list(q:BillingQuery){
  const where=billingFilters(q);const sort={date:Prisma.sql`date`,amount:Prisma.sql`amount`,customer:Prisma.sql`customer`,lawyer:Prisma.sql`lawyer`,consultationId:Prisma.sql`number`,status:Prisma.sql`status`}[q.sortBy??'date']!;const direction=q.direction==='asc'?Prisma.sql`ASC`:Prisma.sql`DESC`;
  const [rows,counts]=await this.prisma.$transaction([
   this.prisma.$queryRaw<any[]>(Prisma.sql`${ledger} SELECT * FROM ledger WHERE ${where} ORDER BY ${sort} ${direction} NULLS LAST,id ${direction} OFFSET ${(q.page-1)*q.perPage} LIMIT ${q.perPage}`),
   this.prisma.$queryRaw<any[]>(Prisma.sql`${ledger} SELECT (SELECT COUNT(*)::int FROM ledger) AS total_records, COUNT(*)::int AS total, COALESCE(SUM(collected) FILTER(WHERE environment='live'),0)::float8 AS collected,COALESCE(SUM(refunded) FILTER(WHERE environment='live'),0)::float8 AS refunded,COUNT(*) FILTER(WHERE environment IN ('sandbox','bypass'))::int AS test_records FROM ledger WHERE ${where}`)
  ]);
  return {data:rows.map(projectBilling),total:counts[0].total,totalRecords:counts[0].total_records,summary:{collected:counts[0].collected,refunded:counts[0].refunded,testRecords:counts[0].test_records},page:q.page,perPage:q.perPage};
 }
 async detail(id:string){const match=/^(consultation|extension)_([a-f0-9-]+)$/i.exec(id);if(!match||!isUUID(match[2]))throw new AppException(HttpStatus.NOT_FOUND,'BILLING_NOT_FOUND','Billing record not found.');const rows=await this.prisma.$queryRaw<any[]>(Prisma.sql`${ledger} SELECT * FROM ledger WHERE id=${id}`);if(!rows[0])throw new AppException(HttpStatus.NOT_FOUND,'BILLING_NOT_FOUND','Billing record not found.');return projectBilling(rows[0]);}
}
export function projectBilling(r:any){
 const test=['sandbox','bypass'].includes(r.environment);
 return {id:r.id,requestId:r.request_id,consultationId:r.number?`AML-${String(r.number).padStart(6,'0')}`:'Unnumbered',kind:r.kind,customer:r.customer??'Name not provided',customerId:r.customer_id,lawyer:r.lawyer??'Unassigned',lawyerId:r.lawyer_id,lawyerDisplayId:r.lawyer_number?`LAW${String(r.lawyer_number).padStart(4,'0')}`:r.lawyer_id?.slice(0,8).toUpperCase()??null,planName:r.plan_name,sessionStatus:r.session_status,amount:r.amount,gst:r.gst,environment:r.environment,provider:r.provider,status:r.status,test,collected:test?0:r.collected,refunded:test?0:r.refunded,refundRequested:r.refund_requested,refundStatus:r.refund_status,refundReason:r.refund_reason,orderId:r.order_id,reference:r.reference,method:r.method,failureReason:r.failure_reason,date:r.date,paidAt:r.paid_at,refundedAt:r.refunded_at,earning:r.kind==='consultation'&&r.gross!==null?{gross:r.gross,commission:r.commission,net:r.net,status:r.earning_status,heldReason:r.held_reason,paidOutAt:r.paid_out_at}:null};
}
