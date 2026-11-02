import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { billingFilters,projectBilling } from '../src/modules/admin-billing/billing.service';
import { requirementFor,satisfies } from '../src/modules/admin-auth/route-permissions';
const base={id:'consultation_1',kind:'consultation',number:12,amount:999,collected:999,refunded:100,refund_requested:100,environment:'live',status:'refunded',gross:999,commission:100,net:899,earning_status:'available',lawyer_number:5};
test('billing projection preserves unknown collection and isolates test money',()=>{
 assert.equal(projectBilling({...base,collected:null}).collected,null);
 for(const environment of ['sandbox','bypass']){const r=projectBilling({...base,environment});assert.equal(r.collected,0);assert.equal(r.refunded,0);assert.equal(r.test,true);}
 assert.equal(projectBilling(base).refunded,100);assert.equal(projectBilling(base).earning?.status,'available');
});
test('extensions do not duplicate the consultation commission or invent refund dates',()=>{
 const r=projectBilling({...base,kind:'extension',refunded_at:null});assert.equal(r.earning,null);assert.equal(r.refundedAt,null);assert.equal(r.consultationId,'AML-000012');assert.equal(r.lawyerDisplayId,'LAW0005');
});
test('billing filters validate dates, use IST boundaries and parameterize search',()=>{
 const q=billingFilters({page:1,perPage:10,from:'2026-11-01',to:'2026-11-01',dateField:'paidAt',search:"x' OR TRUE --"});
 assert.ok(q.values.includes("%x' OR TRUE --%"));assert.ok(!q.sql.includes("x' OR TRUE"));assert.ok(q.values.some(v=>v instanceof Date&&v.toISOString()==='2026-10-31T18:30:00.000Z'));
 assert.throws(()=>billingFilters({page:1,perPage:10,from:'2026-02-30'}));assert.throws(()=>billingFilters({page:1,perPage:10,from:'2026-11-03',to:'2026-11-01'}));
});
test('billing and dashboard data require their own role permissions',()=>{
 assert.deepEqual(requirementFor('GET','/api/v1/admin/billing'),{key:'billing',level:'read'});
 assert.deepEqual(requirementFor('GET','/api/v1/admin/dashboard'),{key:'dashboard',level:'read'});
 assert.equal(satisfies([],requirementFor('GET','/api/v1/admin/billing')!),false);
});

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { BillingService } from '../src/modules/admin-billing/billing.service';
const dbTest=process.env.AML_FLOW_DB_TESTS==='true'?test:test.skip;
dbTest('real ledger includes captured extensions, excludes sandbox money and preserves unknown payments',async()=>{
 process.loadEnvFile('.env');assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname));
 const p=new PrismaClient();const customer=await p.user.create({data:{role:'customer',fullName:'Ledger fixture '+randomUUID()}});
 try{
  const booking=await p.consultationRequest.create({data:{customerId:customer.id,planCode:'ledger_test',planName:'Isolated ledger test',amount:999,durationMinutes:15,status:'completed'}});
  await p.consultationPayment.create({data:{requestId:booking.id,orderId:'test_'+randomUUID(),amount:999,environment:'production',provider:'razorpay',status:'paid',paidAt:new Date(),refundStatus:'completed',refundAmount:100,refundedAt:new Date()}});
  await p.consultationExtension.create({data:{requestId:booking.id,minutes:5,amount:200,status:'accepted',promptEndsAt:new Date(),paidAt:new Date(),orderId:'test_'+randomUUID(),environment:'production'}});
  const sandbox=await p.consultationRequest.create({data:{customerId:customer.id,planCode:'ledger_test',planName:'Isolated sandbox',amount:999,durationMinutes:15,status:'completed'}});
  await p.consultationPayment.create({data:{requestId:sandbox.id,orderId:'test_'+randomUUID(),amount:999,environment:'sandbox',provider:'razorpay',status:'paid',paidAt:new Date()}});
  await p.consultationRequest.create({data:{customerId:customer.id,planCode:'ledger_test',planName:'Isolated missing payment',amount:999,durationMinutes:15,status:'completed'}});
  const service=new BillingService(p as any);const result=await service.list({page:1,perPage:10,search:customer.id});
  assert.equal(result.total,4);assert.equal(result.summary.collected,1199);assert.equal(result.summary.refunded,100);assert.equal(result.summary.testRecords,1);
  assert.equal(result.data.find(r=>r.kind==='extension')?.collected,200);
  assert.equal(result.data.find(r=>r.status==='not_recorded')?.collected,null);
  const filtered=await service.list({page:1,perPage:1,search:customer.id,environment:'live'});assert.equal(filtered.total,2);assert.equal(filtered.data.length,1);
  const detail=await service.detail('consultation_'+booking.id);assert.equal(detail.refunded,100);assert.equal((detail as any).sessionId,undefined);
 }finally{await p.consultationRequest.deleteMany({where:{customerId:customer.id}});await p.user.delete({where:{id:customer.id}});await p.$disconnect();}
});
