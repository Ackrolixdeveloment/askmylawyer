import { HttpStatus,Injectable,Logger } from '@nestjs/common';
import { Prisma,SupportTicket } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { AdminAlertsService } from '../admin-alerts/admin-alerts.service';
import { UserNotificationsService } from '../lawyer-notifications/user-notifications.service';
import { AdminProfile } from '../admin-auth/admin-auth.service';
import { normalisePermissions,levelFor } from '../admin-users/permission-catalogue';
import { CreateTicketDto,SupportListDto,UpdateTicketDto } from './support.dto';
export type SupportActor={id:string;name:string;role:'admin'|'customer'|'lawyer';admin?:AdminProfile};
const fail=(message:string,code='SUPPORT_INVALID',status=HttpStatus.BAD_REQUEST)=>new AppException(status,code,message);
const notFound=()=>fail('Support ticket not found.','SUPPORT_NOT_FOUND',HttpStatus.NOT_FOUND);
export const supportBucket=(status:string)=>['resolved','closed'].includes(status)?'resolved':['in_progress','escalated'].includes(status)?'in-progress':'new';
const states:Record<string,string[]>={new:['new'],'in-progress':['in_progress','escalated'],resolved:['resolved','closed']};
export function supportAccess(actor:SupportActor,bucket:string,write=false){
 if(actor.role!=='admin')return true;
 if(actor.admin?.role.isSystem)return true;
 const value=levelFor(normalisePermissions(actor.admin?.permissions),`support.${bucket}`);
 return write?value==='full':value!=='none';
}
export function supportDateRange(from?:string,to?:string){
 const day=(v:string,end=false)=>{const date=new Date(v+'T00:00:00+05:30');if(!Number.isFinite(date.getTime())||new Date(date.getTime()+19800000).toISOString().slice(0,10)!==v)throw fail('Choose a valid calendar date.');return new Date(date.getTime()+(end?86400000:0));};
 if(from&&to&&from>to)throw fail('End date must follow the start date.');
 return {...(from?{gte:day(from)}:{}),...(to?{lt:day(to,true)}:{})};
}
export function supportFile(file:Express.Multer.File){
 if(!file?.buffer?.length||file.buffer.length>5*1024*1024)throw fail('Choose a file up to 5 MB.');
 const b=file.buffer;let mime='';let extension='';
 if(b.subarray(0,5).toString()==='%PDF-'){mime='application/pdf';extension='pdf';}
 else if(b.length>3&&b[0]===255&&b[1]===216&&b[2]===255){mime='image/jpeg';extension='jpg';}
 else if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){mime='image/png';extension='png';}
 else if(b.length>=12&&b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP'){mime='image/webp';extension='webp';}
 else if(file.originalname.toLowerCase().endsWith('.txt')&&!b.includes(0)&&!b.toString('utf8').includes('\uFFFD')){mime='text/plain';extension='txt';}
 if(!mime)throw fail('Use a PDF, JPG, PNG, WebP or plain text file.');
 const name=basename(file.originalname.replace(/\\/g,'/')).replace(/[\x00-\x1f\x7f]/g,'').slice(0,240)||`attachment.${extension}`;
 return {mime,name};
}
const rowSelect={id:true,number:true,subject:true,status:true,priority:true,categoryName:true,categoryId:true,departmentId:true,assignedToId:true,reporterId:true,reporterRole:true,createdAt:true,updatedAt:true,resolvedAt:true,
 reporter:{select:{id:true,fullName:true,email:true,phone:true,deletedAt:true,lawyerNumber:true}},department:{select:{id:true,name:true}},assignedTo:{select:{id:true,name:true,employeeCode:true}},
 request:{select:{id:true,number:true,status:true,createdAt:true,scheduledFor:true,planName:true}},_count:{select:{messages:true,attachments:true,events:true}}} satisfies Prisma.SupportTicketSelect;
const attachmentSelect={id:true,name:true,mimeType:true,sizeBytes:true,createdAt:true} satisfies Prisma.SupportAttachmentSelect;
@Injectable()
export class SupportService {
 private readonly logger=new Logger(SupportService.name);
 constructor(private readonly prisma:PrismaService,private readonly storage:StorageService,private readonly alerts:AdminAlertsService,private readonly notifications:UserNotificationsService){}
 private allowed(actor:SupportActor,bucket:string,write=false){if(!supportAccess(actor,bucket,write))throw fail('You do not have access to this support queue.','NO_ACCESS',HttpStatus.FORBIDDEN);}
 private async ticket(id:string,actor:SupportActor,write=false,db:Prisma.TransactionClient=this.prisma){const row=await db.supportTicket.findUnique({where:{id}});if(!row||actor.role!=='admin'&&row.reporterId!==actor.id)throw notFound();this.allowed(actor,supportBucket(row.status),write);return row;}
 private async event(tx:Prisma.TransactionClient,ticketId:string,actor:SupportActor,kind:string,detail:Prisma.InputJsonObject){await tx.supportEvent.create({data:{ticketId,actorId:actor.id,actorName:actor.name,kind,detail}});}
 private async announce(actor:SupportActor,ticket:SupportTicket,action:string){
  try{if(actor.role==='admin')await this.notifications.notify(ticket.reporterId,`Support update · TKT-${ticket.number}`,action,'support');else await this.alerts.notify({module:`support.${supportBucket(ticket.status)}`,title:`Support · TKT-${ticket.number}`,body:action,link:`/support/tickets/${ticket.id}`});}catch{this.logger.warn(`Support notification unavailable for ${ticket.id}; saved ticket remains authoritative.`);}
 }
 async categories(){return {data:await this.prisma.ticketCategory.findMany({where:{status:'active',department:{status:'active'}},select:{id:true,name:true,department:{select:{id:true,name:true}}},orderBy:[{name:'asc'},{id:'asc'}],take:100})};}
 async consultations(actor:SupportActor,q?:string){
  const number=/^(?:AML[-\s]*)?0*(\d+)$/i.exec(q??'');
  const where:Prisma.ConsultationRequestWhereInput={...(actor.role==='customer'?{customerId:actor.id}:{lawyerId:actor.id}),...(q?{OR:[{customer:{fullName:{contains:q,mode:'insensitive'}}},{lawyer:{fullName:{contains:q,mode:'insensitive'}}},...(number&&Number(number[1])<=2147483647?[{number:Number(number[1])}]:[])]}:{})};
  const rows=await this.prisma.consultationRequest.findMany({where,orderBy:[{createdAt:'desc'},{id:'desc'}],take:20,select:{id:true,number:true,createdAt:true,status:true,customer:{select:{fullName:true}},lawyer:{select:{fullName:true}}}});
  return {data:rows.map(r=>({id:r.id,code:`AML-${String(r.number??'').padStart(6,'0')}`,participant:actor.role==='customer'?r.lawyer?.fullName??'Unassigned':r.customer.fullName??'Name not provided',date:r.createdAt,status:r.status}))};
 }
 async create(actor:SupportActor,dto:CreateTicketDto){
  if(actor.role==='admin')throw fail('Tickets are created by the customer or lawyer.');
  if(dto.clientKey){const prior=await this.prisma.supportTicket.findFirst({where:{reporterId:actor.id,clientKey:dto.clientKey},select:{id:true}});if(prior)return this.detail(prior.id,actor);}
  if(dto.requestId){const linked=await this.prisma.consultationRequest.findFirst({where:{id:dto.requestId,...(actor.role==='customer'?{customerId:actor.id}:{lawyerId:actor.id})},select:{id:true}});if(!linked)throw fail('Select one of your own consultations.');}
  const category=dto.categoryId?await this.prisma.ticketCategory.findFirst({where:{id:dto.categoryId,status:'active',department:{status:'active'}},select:{id:true,name:true,departmentId:true}}):null;
  if(dto.categoryId&&!category)throw fail('This category is no longer available. Choose another category.');
  let row:SupportTicket;
  try{row=await this.prisma.$transaction(async tx=>{const ticket=await tx.supportTicket.create({data:{clientKey:dto.clientKey,reporterId:actor.id,reporterRole:actor.role,subject:dto.subject,description:dto.description,requestId:dto.requestId,categoryId:category?.id,categoryName:category?.name??'General support',departmentId:category?.departmentId}});await this.event(tx,ticket.id,actor,'created',{status:'new'});return ticket;});}catch(e){if(dto.clientKey&&e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2002'){const prior=await this.prisma.supportTicket.findFirst({where:{reporterId:actor.id,clientKey:dto.clientKey},select:{id:true}});if(prior)return this.detail(prior.id,actor);}throw e;}
  await this.announce(actor,row,'A new ticket needs review.');return this.detail(row.id,actor);
 }
 async list(actor:SupportActor,q:SupportListDto,bucket?:string){
  if(actor.role==='admin'){if(!bucket||!states[bucket])throw fail('Choose a valid support queue.');this.allowed(actor,bucket);}
  const base:Prisma.SupportTicketWhereInput=actor.role==='admin'?{status:{in:states[bucket!]}}:{reporterId:actor.id};
  const and:Prisma.SupportTicketWhereInput[]=[base];
  if(q.status)and.push({status:q.status});if(q.priority)and.push({priority:q.priority});if(q.categoryId)and.push({categoryId:q.categoryId});
  if(actor.role==='admin'){if(q.reporterRole)and.push({reporterRole:q.reporterRole});if(q.departmentId)and.push({departmentId:q.departmentId});if(q.assignment==='mine')and.push({assignedToId:actor.id});if(q.assignment==='unassigned')and.push({assignedToId:null});}
  if(q.search){const number=/^(?:TKT[-\s]*)?0*(\d+)$/i.exec(q.search);and.push({OR:[{subject:{contains:q.search,mode:'insensitive'}},{reporter:{fullName:{contains:q.search,mode:'insensitive'}}},...(actor.role==='admin'?[{reporter:{email:{contains:q.search,mode:'insensitive' as const}}},{reporter:{phone:{contains:q.search}}}]:[]),...(number&&Number(number[1])<=2147483647?[{number:Number(number[1])}]:[])]});}
  if(q.from||q.to)and.push({[q.dateField??'createdAt']:supportDateRange(q.from,q.to)});
  const where={AND:and};const direction=q.direction??'desc';
  const [rows,total,totalRecords]=await this.prisma.$transaction([this.prisma.supportTicket.findMany({where,orderBy:[{[q.sortBy??'createdAt']:direction},{id:direction}],skip:(q.page-1)*q.perPage,take:q.perPage,select:rowSelect}),this.prisma.supportTicket.count({where}),this.prisma.supportTicket.count({where:base})]);
  return {data:rows.map(r=>this.project(r,actor)),total,totalRecords,page:q.page,perPage:q.perPage};
 }
 private project(r:Prisma.SupportTicketGetPayload<{select:typeof rowSelect}>,actor:SupportActor){return {...r,code:`TKT-${r.number}`,reporter:actor.role==='admin'?r.reporter:undefined};}
 async detail(id:string,actor:SupportActor){
  await this.ticket(id,actor);
  const row=await this.prisma.supportTicket.findUniqueOrThrow({where:{id},select:{...rowSelect,description:true,resolution:true,attachments:{select:attachmentSelect,orderBy:{createdAt:'asc'}},messages:{orderBy:[{createdAt:'desc'},{id:'desc'}],take:51,select:{id:true,authorKind:true,authorName:true,body:true,createdAt:true}},events:actor.role==='admin'?{orderBy:[{createdAt:'desc'},{id:'desc'}],take:50}:false}});
  return {...this.project(row,actor),description:row.description,resolution:row.resolution,attachments:row.attachments,messages:row.messages.slice(0,50).reverse(),hasMoreMessages:row.messages.length>50,events:actor.role==='admin'?row.events:undefined};
 }
 async events(id:string,actor:SupportActor,before?:string){if(actor.role!=='admin')throw fail('Admin access required.','NO_ACCESS',HttpStatus.FORBIDDEN);await this.ticket(id,actor);if(before&&!await this.prisma.supportEvent.findFirst({where:{id:before,ticketId:id},select:{id:true}}))throw notFound();const rows=await this.prisma.supportEvent.findMany({where:{ticketId:id},...(before?{cursor:{id:before},skip:1}:{}),orderBy:[{createdAt:'desc'},{id:'desc'}],take:51});return {data:rows.slice(0,50),hasMore:rows.length>50};}
 async messages(id:string,actor:SupportActor,before?:string){await this.ticket(id,actor);if(before&&!await this.prisma.supportMessage.findFirst({where:{id:before,ticketId:id},select:{id:true}}))throw notFound();const rows=await this.prisma.supportMessage.findMany({where:{ticketId:id},...(before?{cursor:{id:before},skip:1}:{}),orderBy:[{createdAt:'desc'},{id:'desc'}],take:51,select:{id:true,authorKind:true,authorName:true,body:true,createdAt:true}});return {data:rows.slice(0,50).reverse(),hasMore:rows.length>50};}
 async reply(id:string,actor:SupportActor,body:string){
  const row=await this.prisma.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM support_tickets WHERE id=${id}::uuid FOR UPDATE`;const ticket=await this.ticket(id,actor,true,tx);if(ticket.status==='closed')throw fail('This ticket is closed. Create a new ticket or ask an administrator to reopen it.');
   await tx.supportMessage.create({data:{ticketId:id,authorId:actor.id,authorKind:actor.role==='admin'?'admin':'user',authorName:actor.name,body}});
   const reopened=ticket.status==='resolved';const status=reopened?'in_progress':ticket.status==='new'&&actor.role==='admin'?'in_progress':ticket.status;
   const updated=await tx.supportTicket.update({where:{id},data:{updatedAt:new Date(),status,...(reopened?{resolution:null,resolvedAt:null}:{})}});await this.event(tx,id,actor,reopened?'reopened':'reply',{status});return updated;});
  await this.announce(actor,row,actor.role==='admin'?'Support has replied to your ticket.':'A new reply needs review.');return {id:row.id,status:row.status,updatedAt:row.updatedAt};
 }
 async assignees(actor:SupportActor,q?:string,departmentId?:string,bucket?:string){
  if(!Object.keys(states).some(b=>supportAccess(actor,b)))throw fail('No support access.','NO_ACCESS',HttpStatus.FORBIDDEN);
  const queues=bucket?[bucket]:Object.keys(states);
  const rows=await this.prisma.adminUser.findMany({where:{status:'active',deletedAt:null,role:{status:'active',OR:[{isSystem:true},{...(departmentId?{departmentId}:{}),OR:queues.map(b=>({permissions:{path:[`support.${b}`],equals:'full'}}))}]},...(q?{OR:[{name:{contains:q,mode:'insensitive'}},{employeeCode:{contains:q,mode:'insensitive'}}]}:{})},select:{id:true,name:true,employeeCode:true},orderBy:[{name:'asc'},{id:'asc'}],take:20});
  return {data:rows};

 }
 async update(id:string,actor:SupportActor,dto:UpdateTicketDto){
  if(actor.role!=='admin')throw fail('Only support administrators can change ticket workflow.','NO_ACCESS',HttpStatus.FORBIDDEN);
  let previousStatus='';let previousAssignee:string|null=null;
  const row=await this.prisma.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM support_tickets WHERE id=${id}::uuid FOR UPDATE`;const ticket=await this.ticket(id,actor,true,tx);previousStatus=ticket.status;previousAssignee=ticket.assignedToId;
   if(ticket.updatedAt.getTime()!==new Date(dto.expectedUpdatedAt).getTime())throw fail('This ticket changed. Refresh it before saving.','SUPPORT_CHANGED',HttpStatus.CONFLICT);
   if(dto.assignedToId&&dto.assignedToId!==ticket.assignedToId){const candidate=await tx.adminUser.findFirst({where:{id:dto.assignedToId,status:'active',deletedAt:null,role:{status:'active'}},select:{role:{select:{isSystem:true,permissions:true,departmentId:true}}}});if(!candidate||!candidate.role.isSystem&&((ticket.departmentId&&candidate.role.departmentId!==ticket.departmentId)||levelFor(normalisePermissions(candidate.role.permissions),`support.${supportBucket(dto.status??ticket.status)}`)!=='full'))throw fail('Choose an active support administrator in this department.');}
   const terminal=dto.status&&['resolved','closed'].includes(dto.status);
   if(terminal&&!(dto.resolution?.trim()||ticket.resolution))throw fail('Enter the resolution before resolving or closing a ticket.');
   const updated=await tx.supportTicket.update({where:{id},data:{status:dto.status,priority:dto.priority,assignedToId:dto.assignedToId,...(terminal?{resolution:dto.resolution??ticket.resolution,resolvedAt:ticket.resolvedAt??new Date()}:dto.status?{resolution:null,resolvedAt:null}:{})}});
   const assignedPeople=await tx.adminUser.findMany({where:{id:{in:[ticket.assignedToId,updated.assignedToId].filter((v):v is string=>Boolean(v))}},select:{id:true,name:true,employeeCode:true}});
   const assignedName=(value:string|null)=>{const person=assignedPeople.find(p=>p.id===value);return person?person.name+' · '+person.employeeCode:value??'Unassigned';};
   await this.event(tx,id,actor,'updated',{before:{status:ticket.status,priority:ticket.priority,assignedToId:ticket.assignedToId,assignedTo:assignedName(ticket.assignedToId),resolution:ticket.resolution},after:{status:updated.status,priority:updated.priority,assignedToId:updated.assignedToId,assignedTo:assignedName(updated.assignedToId),resolution:updated.resolution}});return updated;});
  if(row.status!==previousStatus)await this.announce(actor,row,'Support ticket status: '+row.status.replaceAll('_',' ')+'. Open the ticket for details.');
  if(row.assignedToId&&row.assignedToId!==previousAssignee&&row.assignedToId!==actor.id)await this.alerts.notifyOne(row.assignedToId,{module:`support.${supportBucket(row.status)}`,title:`Assigned · TKT-${row.number}`,body:'A support ticket has been assigned to you.',link:`/support/tickets/${row.id}`}).catch(()=>this.logger.warn('Support assignment alert unavailable.'));
  return {id:row.id,status:row.status,updatedAt:row.updatedAt};
 }
 async upload(id:string,actor:SupportActor,file:Express.Multer.File){
  const ticket=await this.ticket(id,actor,true);if(ticket.status==='closed')throw fail('Attachments cannot be added to a closed ticket.');
  const {mime,name}=supportFile(file);const key=`support/${id}/${randomUUID()}`;await this.storage.put(key,file.buffer,mime);
  try{await this.prisma.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM support_tickets WHERE id=${id}::uuid FOR UPDATE`;const fresh=await this.ticket(id,actor,true,tx);if(fresh.status==='closed')throw fail('This ticket is closed.');if(await tx.supportAttachment.count({where:{ticketId:id}})>=10)throw fail('A ticket can have up to 10 attachments.');await tx.supportAttachment.create({data:{ticketId:id,key,name,mimeType:mime,sizeBytes:file.buffer.length,uploadedById:actor.id}});await tx.supportTicket.update({where:{id},data:{updatedAt:new Date()}});await this.event(tx,id,actor,'attachment_added',{name});});}catch(e){await this.storage.delete(key);throw e;}
  await this.announce(actor,ticket,'A new attachment has been added to the support ticket.');
  return {success:true};
 }
 async attachment(id:string,fileId:string,actor:SupportActor){await this.ticket(id,actor);const file=await this.prisma.supportAttachment.findFirst({where:{id:fileId,ticketId:id}});if(!file)throw notFound();return {name:file.name,body:await this.storage.get(file.key)};}
}
