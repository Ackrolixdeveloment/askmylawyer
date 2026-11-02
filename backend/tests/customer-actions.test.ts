import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AdminCustomersService } from '../src/modules/admin-customers/admin-customers.service';
import { AdminConsultationsService } from '../src/modules/admin-consultations/admin-consultations.service';
test('scheduled and unpaid bookings prevent customer deletion and suspension',async()=>{
 for(const state of ['scheduled','pending_payment']){
  let writes=0;const service=new AdminCustomersService({user:{findFirst:async()=>({id:'customer'}),update:async()=>{writes++;}},consultationRequest:{count:async(q:any)=>q.where.status.in.includes(state)?1:0}} as any);
  await assert.rejects(service.remove('customer'));await assert.rejects(service.update('customer',{status:'suspended'}));assert.equal(writes,0);
 }
});
test('report attachments are scoped to the selected consultation',async()=>{
 let query:any;const service=new AdminConsultationsService({reportAttachment:{findFirst:async(q:any)=>{query=q;return null;}}} as any);
 await assert.rejects(service.attachment('consultation-one','attachment-from-another'));
 assert.deepEqual(query.where,{id:'attachment-from-another',report:{requestId:'consultation-one'}});
});
