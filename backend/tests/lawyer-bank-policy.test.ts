import 'reflect-metadata';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lawyerProfileCompletion} from '../src/common/lawyer-profile-completion';
import {LawyerRegistrationService} from '../src/modules/lawyer-registration/lawyer-registration.service';
import {EarningsService} from '../src/modules/earnings/earnings.service';

test('profile completion reflects saved sections and bank without gating consultations',()=>{
 const stamp=new Date();const profile={personalCompletedAt:stamp,kycCompletedAt:stamp,professionalCompletedAt:stamp,profileCompletedAt:stamp};
 assert.equal(lawyerProfileCompletion(profile,false).percent,80);
 assert.equal(lawyerProfileCompletion(profile,true).percent,100);
 assert.equal(lawyerProfileCompletion(null,false).percent,0);
 assert.deepEqual(lawyerProfileCompletion(profile,false).missing,['Bank account']);
});
test('registration can submit four required sections without bank details',async()=>{
 const stamp=new Date();let submitted=false;
 const profile={onboardingStatus:'draft',personalCompletedAt:stamp,kycCompletedAt:stamp,professionalCompletedAt:stamp,profileCompletedAt:stamp,bankCompletedAt:null};
 const service=new LawyerRegistrationService({lawyerProfile:{findUniqueOrThrow:async()=>profile,upsert:async()=>profile,updateMany:async()=>{submitted=true;return{count:1};}},user:{findUnique:async()=>({fullName:'Fixture'})}} as any,{} as any,{notify:async()=>{}} as any);
 (service as any).assertEditable=async()=>profile;
 service.get=async()=>({}) as any;
 await service.submit('fixture');assert.equal(submitted,true);
});
test('payout bank readiness distinguishes missing, pending and approved without fake transfer',async()=>{
 for(const [bank,pending,status] of [[null,null,'missing'],[null,{id:'pending'},'pending_review'],[{id:'bank'},null,'approved']] as const){
 const service=new EarningsService({lawyerBankAccount:{findUnique:async()=>bank},lawyerEditRequest:{findFirst:async()=>pending}} as any);
 const result=await service.payoutReadiness('fixture');assert.equal(result.bankStatus,status);assert.equal(result.bankReady,!!bank);assert.equal(result.payoutRequestsAvailable,false);
 }
});

import {PrismaClient} from '@prisma/client';
import {PresenceService} from '../src/modules/consultations/presence.service';
import {env} from '../src/config/env';
const dbTest=process.env.AML_FLOW_DB_TESTS==='true'?test:test.skip;
dbTest('real bank-free application submits and approved lawyer remains eligible for matching',async()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(env.DATABASE_URL).hostname));
 const p=new PrismaClient();const now=new Date();
 const user=await p.user.create({data:{role:'lawyer',status:'active',fullName:'Bank optional fixture',lawyerProfile:{create:{personalCompletedAt:now,kycCompletedAt:now,professionalCompletedAt:now,profileCompletedAt:now}},presence:{create:{isOnline:true,lastHeartbeat:now}}}});
 try{
  const service=new LawyerRegistrationService(p as any,{} as any,{notify:async()=>{}} as any);
  const snapshot=await service.get(user.id);assert.equal(snapshot.canSubmit,true);assert.equal(snapshot.completedSteps.includes('bank' as any),false);
  await service.submit(user.id);
  assert.equal((await p.lawyerProfile.findUniqueOrThrow({where:{userId:user.id}})).onboardingStatus,'submitted');
  await p.lawyerProfile.update({where:{userId:user.id},data:{onboardingStatus:'approved'}});
  assert.equal(await p.lawyerBankAccount.findUnique({where:{userId:user.id}}),null);
  const candidates=await new PresenceService(p as any,{forEngine:async()=>({ignoreLawyerFilters:false,locationFreshnessMinutes:5})} as any).candidates();
  assert.ok(candidates.includes(user.id));
 }finally{await p.user.delete({where:{id:user.id}});await p.$disconnect();}
});
