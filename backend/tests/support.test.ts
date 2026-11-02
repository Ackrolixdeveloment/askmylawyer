import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes,randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { env } from '../src/config/env';
import { SupportService,supportAccess,supportDateRange,supportFile,type SupportActor } from '../src/modules/support/support.service';
const dbTest=process.env.AML_FLOW_DB_TESTS==='true'?test:test.skip;
test('support permissions do not turn category access into ticket access',()=>{
 const actor:SupportActor={id:'admin',name:'Admin',role:'admin',admin:{role:{isSystem:false},permissions:{'support.categories':'full','support.new':'read'}} as any};
 assert.equal(supportAccess(actor,'new'),true);assert.equal(supportAccess(actor,'new',true),false);assert.equal(supportAccess(actor,'in-progress'),false);
});
test('support dates use inclusive IST days and reject reversed or impossible ranges',()=>{
 const r=supportDateRange('2026-11-02','2026-11-02');assert.equal(r.gte!.toISOString(),'2026-11-01T18:30:00.000Z');assert.equal(r.lt!.toISOString(),'2026-11-02T18:30:00.000Z');assert.throws(()=>supportDateRange('2026-02-30'));assert.throws(()=>supportDateRange('2026-11-03','2026-11-02'));
});
test('attachments validate content and size and strip unsafe file paths',()=>{
 const file={originalname:'../../evidence.pdf',buffer:Buffer.from('%PDF-test')} as Express.Multer.File;assert.deepEqual(supportFile(file),{name:'evidence.pdf',mime:'application/pdf'});
 assert.throws(()=>supportFile({...file,buffer:Buffer.from('not a PDF')}));assert.throws(()=>supportFile({...file,buffer:Buffer.alloc(5*1024*1024+1)}));assert.throws(()=>supportFile(undefined as any));
});
async function fixture(run:(f:any)=>Promise<void>){
 assert.ok(['localhost','127.0.0.1'].includes(new URL(env.DATABASE_URL).hostname));const p=new PrismaClient();const tag=randomUUID().slice(0,8);
 const department=await p.department.create({data:{name:'Support fixture '+tag,code:'ST'+tag}});const otherDepartment=await p.department.create({data:{name:'Other fixture '+tag,code:'SO'+tag}});
 const category=await p.ticketCategory.create({data:{name:'Fixture category',departmentId:department.id}});
 const permissions={'support.new':'full','support.in-progress':'full','support.resolved':'full'};
 const role=await p.role.create({data:{name:'Support fixture '+tag,departmentId:department.id,permissions}});const otherRole=await p.role.create({data:{name:'Other support '+tag,departmentId:otherDepartment.id,permissions}});
 const admin=await p.adminUser.create({data:{employeeCode:'SA'+tag,name:'Support administrator',email:tag+'@example.invalid',passwordHash:'not-a-login-hash',roleId:role.id}});const wrongAdmin=await p.adminUser.create({data:{employeeCode:'SW'+tag,name:'Other administrator',email:'other-'+tag+'@example.invalid',passwordHash:'not-a-login-hash',roleId:otherRole.id}});
 const customer=await p.user.create({data:{role:'customer',fullName:'Support customer '+tag}});const other=await p.user.create({data:{role:'customer',fullName:'Other customer '+tag}});const lawyer=await p.user.create({data:{role:'lawyer',fullName:'Support lawyer '+tag}});
 const request=await p.consultationRequest.create({data:{customerId:customer.id,lawyerId:lawyer.id,planCode:'support_fixture',planName:'Support fixture',durationMinutes:15,amount:0,status:'completed'}});
 const files=new Map<string,Buffer>();const notices:any[]=[];const storage={put:async(k:string,b:Buffer)=>{files.set(k,b);},get:async(k:string)=>{if(!files.has(k))throw Error('missing file');return files.get(k)!;},delete:async(k:string)=>{files.delete(k);}};
 const service=new SupportService(p as any,storage as any,{notify:async(v:any)=>{notices.push(v);},notifyOne:async(_id:string,v:any)=>{notices.push(v);}} as any,{notify:async(...v:any[])=>{notices.push(v);}} as any);
 const a:SupportActor={id:admin.id,name:admin.name,role:'admin',admin:{...admin,role,permissions} as any};const c:SupportActor={id:customer.id,name:customer.fullName!,role:'customer'};const o:SupportActor={id:other.id,name:other.fullName!,role:'customer'};const l:SupportActor={id:lawyer.id,name:lawyer.fullName!,role:'lawyer'};
 try{await run({p,service,a,c,o,l,category,request,files,notices,wrongAdmin});}
 finally{await p.supportTicket.deleteMany({where:{reporterId:{in:[customer.id,other.id,lawyer.id]}}});await p.consultationRequest.delete({where:{id:request.id}});await p.user.deleteMany({where:{id:{in:[customer.id,other.id,lawyer.id]}}});await p.adminUser.deleteMany({where:{id:{in:[admin.id,wrongAdmin.id]}}});await p.role.deleteMany({where:{id:{in:[role.id,otherRole.id]}}});await p.ticketCategory.delete({where:{id:category.id}});await p.department.deleteMany({where:{id:{in:[department.id,otherDepartment.id]}}});await p.$disconnect();}
}
dbTest('customer and lawyer ownership, private ticket access and idempotent submission',async()=>fixture(async f=>{
 const input={subject:'Payment question',description:'Please investigate the payment.',categoryId:f.category.id,requestId:f.request.id,clientKey:randomBytes(16).toString('hex')};
 const results=await Promise.all([f.service.create(f.c,input),f.service.create(f.c,input)]);assert.equal(results[0].id,results[1].id);assert.equal(await f.p.supportTicket.count({where:{reporterId:f.c.id}}),1);
 assert.equal(results[0].reporter,undefined);assert.equal(results[0].events,undefined);
 await assert.rejects(f.service.detail(results[0].id,f.o));await assert.rejects(f.service.reply(results[0].id,f.l,'Unauthorized reply'));
 await assert.rejects(f.service.create(f.o,{...input,clientKey:randomBytes(16).toString('hex')}));
 const lawyerTicket=await f.service.create(f.l,{subject:'Lawyer question',description:'Need assistance',requestId:f.request.id});assert.equal(lawyerTicket.reporterRole,'lawyer');
 const mine=await f.service.list(f.c,{page:1,perPage:10});assert.equal(mine.total,1);assert.equal(mine.data[0].id,results[0].id);
 const byRole=await f.service.list(f.a,{page:1,perPage:1,reporterRole:'lawyer',search:'Lawyer question'},'new');assert.equal(byRole.total,1);assert.equal(byRole.data[0].id,lawyerTicket.id);
}));
dbTest('reply, assignment, optimistic updates, resolution, reopen, close and audit',async()=>fixture(async f=>{
 const ticket=await f.service.create(f.c,{subject:'Workflow test',description:'Need assistance',categoryId:f.category.id});
 const readonly={...f.a,admin:{...f.a.admin,permissions:{'support.new':'read'}}};await assert.rejects(f.service.reply(ticket.id,readonly,'Not allowed'));
 const before=await f.service.detail(ticket.id,f.a);await f.service.reply(ticket.id,f.a,'We are investigating.');let current=await f.service.detail(ticket.id,f.a);assert.equal(current.status,'in_progress');assert.equal(current.messages.length,1);
 await assert.rejects(f.service.update(ticket.id,f.a,{expectedUpdatedAt:before.updatedAt.toISOString(),status:'resolved',resolution:'Done'}));
 await assert.rejects(f.service.update(ticket.id,f.a,{expectedUpdatedAt:current.updatedAt.toISOString(),assignedToId:f.wrongAdmin.id}));
 await assert.rejects(f.service.update(ticket.id,f.a,{expectedUpdatedAt:current.updatedAt.toISOString(),status:'resolved'}));
 await f.service.update(ticket.id,f.a,{expectedUpdatedAt:current.updatedAt.toISOString(),status:'resolved',resolution:'Resolved after investigation',assignedToId:f.a.id});current=await f.service.detail(ticket.id,f.c);assert.equal(current.resolution,'Resolved after investigation');assert.ok(current.resolvedAt);assert.equal(current.events,undefined);
 await f.service.reply(ticket.id,f.c,'The issue is still present.');current=await f.service.detail(ticket.id,f.a);assert.equal(current.status,'in_progress');assert.equal(current.resolvedAt,null);assert.equal(current.resolution,null);
 await f.service.update(ticket.id,f.a,{expectedUpdatedAt:current.updatedAt.toISOString(),status:'closed',resolution:'Follow-up resolved'});await assert.rejects(f.service.reply(ticket.id,f.c,'Cannot reply'));
 current=await f.service.detail(ticket.id,f.a);assert.ok(current.events.some((e:any)=>e.kind==='reopened'));assert.ok(current.events.some((e:any)=>e.actorName==='Support administrator'&&e.detail.after?.resolution==='Follow-up resolved'));
}));
dbTest('attachments remain private, capped under concurrent uploads and scoped to ticket',async()=>fixture(async f=>{
 const ticket=await f.service.create(f.c,{subject:'Attachment fixture',description:'Test private files'});const file={originalname:'evidence.pdf',buffer:Buffer.from('%PDF-fixture')} as Express.Multer.File;
 for(let i=0;i<9;i++)await f.service.upload(ticket.id,f.c,file);
 const results=await Promise.allSettled([f.service.upload(ticket.id,f.c,file),f.service.upload(ticket.id,f.c,file)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(await f.p.supportAttachment.count({where:{ticketId:ticket.id}}),10);assert.equal(f.files.size,10);
 const detail=await f.service.detail(ticket.id,f.c);assert.equal(detail.attachments[0].key,undefined);const attachment=detail.attachments[0];assert.deepEqual((await f.service.attachment(ticket.id,attachment.id,f.a)).body,file.buffer);
 await assert.rejects(f.service.attachment(ticket.id,attachment.id,f.o));const other=await f.service.create(f.c,{subject:'Other ticket',description:'Different scope'});await assert.rejects(f.service.attachment(other.id,attachment.id,f.c));
}));
dbTest('messages and audit history paginate without exposing another ticket cursor',async()=>fixture(async f=>{
 const t=await f.service.create(f.c,{subject:'History fixture',description:'History test'});const other=await f.service.create(f.c,{subject:'Other cursor',description:'Other test'});
 await f.p.supportMessage.createMany({data:Array.from({length:55},(_,i)=>({ticketId:t.id,authorId:f.c.id,authorKind:'user',authorName:f.c.name,body:'Message '+i}))});
 await f.p.supportEvent.createMany({data:Array.from({length:55},(_,i)=>({ticketId:t.id,actorId:f.a.id,actorName:f.a.name,kind:'fixture',detail:{i}}))});
 const d=await f.service.detail(t.id,f.a);assert.equal(d.messages.length,50);assert.equal(d.hasMoreMessages,true);const older=await f.service.messages(t.id,f.c,d.messages[0].id);assert.equal(older.data.length,5);assert.equal(older.hasMore,false);assert.equal(new Set([...d.messages,...older.data].map(m=>m.id)).size,55);
 const history=await f.service.events(t.id,f.a,d.events[d.events.length-1].id);assert.equal(history.data.length,6);await assert.rejects(f.service.events(t.id,f.c));
 await assert.rejects(f.service.messages(other.id,f.c,d.messages[0].id));
}));

import { AdminCustomersService } from '../src/modules/admin-customers/admin-customers.service';
dbTest('customer support history includes only queues the admin may read',async()=>fixture(async f=>{
 const first=await f.service.create(f.c,{subject:'Customer history new',description:'New ticket'});const second=await f.service.create(f.c,{subject:'Customer history resolved',description:'Resolved ticket'});
 await f.service.update(second.id,f.a,{expectedUpdatedAt:second.updatedAt.toISOString(),status:'resolved',resolution:'Answered'});
 const customers=new AdminCustomersService(f.p as any);const all=await customers.detail(f.c.id,f.a.admin);assert.equal(all.supportTicketTotal,2);
 const limited=await customers.detail(f.c.id,{...f.a.admin,permissions:{'support.new':'read'}});assert.equal(limited.supportTicketTotal,1);assert.equal(limited.supportTickets[0].id,first.id);
 const hidden=await customers.detail(f.c.id,{...f.a.admin,permissions:{customers:'read'}});assert.equal(hidden.supportAccess,false);assert.equal(hidden.supportTicketTotal,0);assert.deepEqual(hidden.supportTickets,[]);
}));
