import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { hash,verify } from '@node-rs/argon2';
import { PrismaClient } from '@prisma/client';
import { PasswordRecoveryService } from '../src/modules/admin-auth/password-recovery.service';
import { env } from '../src/config/env';
const dbTest=process.env.AML_FLOW_DB_TESTS==='true'?test:test.skip;
dbTest('recovery enforces attempts, expiry and one-time reset; revokes sessions',async()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(env.DATABASE_URL).hostname));
 const p=new PrismaClient();const tag=randomUUID().slice(0,8);const role=await p.role.create({data:{name:'Recovery fixture '+tag}});const original='Original-test-'+tag;const changed='Changed-test-'+tag;
 const admin=await p.adminUser.create({data:{employeeCode:'TEST-'+tag,name:'Recovery fixture',email:tag+'@example.invalid',passwordHash:await hash(original),roleId:role.id}});
 let code='';let sends=0;const service=new PasswordRecoveryService(p as any,{send:async(m:{text:string})=>{code=/\b\d{6}\b/.exec(m.text)![0];sends++;}} as any);
 try{
  const unknown=await service.request('missing-'+tag+'@example.invalid');assert.equal(sends,0);assert.ok(unknown.challengeId);
  const first=await service.request(admin.email);assert.equal(sends,1);assert.equal((await service.request(admin.email)).challengeId,first.challengeId);assert.equal(sends,1);
  for(let i=0;i<5;i++)await assert.rejects(service.verifyCode(first.challengeId,'000000'));
  await assert.rejects(service.verifyCode(first.challengeId,code));
  await p.adminPasswordReset.update({where:{id:first.challengeId},data:{expiresAt:new Date(Date.now()-1000)}});
  const second=await service.request(admin.email);assert.notEqual(first.challengeId,second.challengeId);
  const token=await service.verifyCode(second.challengeId,code);await assert.rejects(service.verifyCode(second.challengeId,code));
  await p.adminSession.create({data:{adminUserId:admin.id,refreshTokenHash:randomUUID(),expiresAt:new Date(Date.now()+3600000)}});
  await assert.rejects(service.reset(second.challengeId,'0'.repeat(64),changed));
  await service.reset(second.challengeId,token.resetToken,changed);
  const updated=await p.adminUser.findUniqueOrThrow({where:{id:admin.id}});assert.equal(await verify(updated.passwordHash,changed),true);assert.equal(await verify(updated.passwordHash,original),false);
  assert.equal(await p.adminSession.count({where:{adminUserId:admin.id,revokedAt:null}}),0);
  await assert.rejects(service.reset(second.challengeId,token.resetToken,'Another-test-'+tag));
  assert.equal(await p.adminPasswordReset.count({where:{adminId:admin.id,tokenHash:token.resetToken}}),0);
 }finally{await p.adminUser.delete({where:{id:admin.id}});await p.role.delete({where:{id:role.id}});await p.$disconnect();}
});
