import { Body,Controller,Get,HttpCode,Param,ParseUUIDPipe,Post,Put,Query,Req,Res,StreamableFile,UploadedFile,UseGuards,UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminAuthGuard,type AdminRequest } from '../admin-auth/admin-auth.guard';
import { CustomerAuthGuard,type CustomerRequest } from '../customer-auth/customer-auth.guard';
import { LawyerAuthGuard,type LawyerRequest } from '../lawyer-auth/lawyer-auth.guard';
import { SupportService,type SupportActor } from './support.service';
import { CreateTicketDto,ReplyTicketDto,SupportCursorDto,SupportListDto,SupportLookupDto,UpdateTicketDto } from './support.dto';
const adminActor=(r:AdminRequest):SupportActor=>({id:r.admin.id,name:r.admin.name,role:'admin',admin:r.admin});
function download(file:{name:string;body:Buffer},res:Response){res.setHeader('Content-Type','application/octet-stream');res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Disposition',`attachment; filename="support-attachment"; filename*=UTF-8''${encodeURIComponent(file.name).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16))}`);return new StreamableFile(file.body);}
@Controller('admin/support') @UseGuards(AdminAuthGuard)
export class AdminSupportController {
 constructor(private readonly support:SupportService){}
 @Get('categories') categories(){return this.support.categories();}
 @Get('assignees') assignees(@Req() r:AdminRequest,@Query() q:SupportLookupDto){return this.support.assignees(adminActor(r),q.q,q.departmentId,q.bucket);}
 @Get('bucket/:bucket') list(@Req() r:AdminRequest,@Param('bucket') bucket:string,@Query() q:SupportListDto){return this.support.list(adminActor(r),q,bucket);}
 @Get('tickets/:id') detail(@Req() r:AdminRequest,@Param('id',ParseUUIDPipe) id:string){return this.support.detail(id,adminActor(r));}
 @Get('tickets/:id/events') events(@Req() r:AdminRequest,@Param('id',ParseUUIDPipe) id:string,@Query() q:SupportCursorDto){return this.support.events(id,adminActor(r),q.before);}
 @Get('tickets/:id/messages') messages(@Req() r:AdminRequest,@Param('id',ParseUUIDPipe) id:string,@Query() q:SupportCursorDto){return this.support.messages(id,adminActor(r),q.before);}
 @Post('tickets/:id/messages') @HttpCode(200) @Throttle({default:{limit:30,ttl:60000}}) reply(@Req() r:AdminRequest,@Param('id',ParseUUIDPipe) id:string,@Body() q:ReplyTicketDto){return this.support.reply(id,adminActor(r),q.body);}
 @Put('tickets/:id') update(@Req() r:AdminRequest,@Param('id',ParseUUIDPipe) id:string,@Body() q:UpdateTicketDto){return this.support.update(id,adminActor(r),q);}
 @Post('tickets/:id/attachments') @UseInterceptors(FileInterceptor('file',{limits:{fileSize:5*1024*1024,files:1}})) upload(@Req() r:AdminRequest,@Param('id',ParseUUIDPipe) id:string,@UploadedFile() file:Express.Multer.File){return this.support.upload(id,adminActor(r),file);}
 @Get('tickets/:id/attachments/:fileId') async file(@Req() r:AdminRequest,@Param('id',ParseUUIDPipe) id:string,@Param('fileId',ParseUUIDPipe) fileId:string,@Res({passthrough:true}) res:Response){return download(await this.support.attachment(id,fileId,adminActor(r)),res);}
}

@Controller('customer/support') @UseGuards(CustomerAuthGuard)
export class CustomerSupportController {
 constructor(private readonly support:SupportService){}
 @Get('categories') categories(){return this.support.categories();}
 @Get('consultations') consultations(@Req() r:CustomerRequest,@Query() q:SupportLookupDto){return this.support.consultations({id:r.customer.id,name:r.customer.fullName??'Customer',role:'customer' as const},q.q);}
 @Get() list(@Req() r:CustomerRequest,@Query() q:SupportListDto){return this.support.list({id:r.customer.id,name:r.customer.fullName??'Customer',role:'customer' as const},q);}
 @Post() @HttpCode(201) @Throttle({default:{limit:5,ttl:60000}}) create(@Req() r:CustomerRequest,@Body() q:CreateTicketDto){return this.support.create({id:r.customer.id,name:r.customer.fullName??'Customer',role:'customer' as const},q);}
 @Get(':id') detail(@Req() r:CustomerRequest,@Param('id',ParseUUIDPipe) id:string){return this.support.detail(id,{id:r.customer.id,name:r.customer.fullName??'Customer',role:'customer' as const});}
 @Get(':id/messages') messages(@Req() r:CustomerRequest,@Param('id',ParseUUIDPipe) id:string,@Query() q:SupportCursorDto){return this.support.messages(id,{id:r.customer.id,name:r.customer.fullName??'Customer',role:'customer' as const},q.before);}
 @Post(':id/messages') @HttpCode(200) @Throttle({default:{limit:30,ttl:60000}}) reply(@Req() r:CustomerRequest,@Param('id',ParseUUIDPipe) id:string,@Body() q:ReplyTicketDto){return this.support.reply(id,{id:r.customer.id,name:r.customer.fullName??'Customer',role:'customer' as const},q.body);}
 @Post(':id/attachments') @UseInterceptors(FileInterceptor('file',{limits:{fileSize:5*1024*1024,files:1}})) upload(@Req() r:CustomerRequest,@Param('id',ParseUUIDPipe) id:string,@UploadedFile() file:Express.Multer.File){return this.support.upload(id,{id:r.customer.id,name:r.customer.fullName??'Customer',role:'customer' as const},file);}
 @Get(':id/attachments/:fileId') async file(@Req() r:CustomerRequest,@Param('id',ParseUUIDPipe) id:string,@Param('fileId',ParseUUIDPipe) fileId:string,@Res({passthrough:true}) res:Response){return download(await this.support.attachment(id,fileId,{id:r.customer.id,name:r.customer.fullName??'Customer',role:'customer' as const}),res);}
}

@Controller('lawyer/support') @UseGuards(LawyerAuthGuard)
export class LawyerSupportController {
 constructor(private readonly support:SupportService){}
 @Get('categories') categories(){return this.support.categories();}
 @Get('consultations') consultations(@Req() r:LawyerRequest,@Query() q:SupportLookupDto){return this.support.consultations({id:r.lawyer.id,name:r.lawyer.fullName??'Lawyer',role:'lawyer' as const},q.q);}
 @Get() list(@Req() r:LawyerRequest,@Query() q:SupportListDto){return this.support.list({id:r.lawyer.id,name:r.lawyer.fullName??'Lawyer',role:'lawyer' as const},q);}
 @Post() @HttpCode(201) @Throttle({default:{limit:5,ttl:60000}}) create(@Req() r:LawyerRequest,@Body() q:CreateTicketDto){return this.support.create({id:r.lawyer.id,name:r.lawyer.fullName??'Lawyer',role:'lawyer' as const},q);}
 @Get(':id') detail(@Req() r:LawyerRequest,@Param('id',ParseUUIDPipe) id:string){return this.support.detail(id,{id:r.lawyer.id,name:r.lawyer.fullName??'Lawyer',role:'lawyer' as const});}
 @Get(':id/messages') messages(@Req() r:LawyerRequest,@Param('id',ParseUUIDPipe) id:string,@Query() q:SupportCursorDto){return this.support.messages(id,{id:r.lawyer.id,name:r.lawyer.fullName??'Lawyer',role:'lawyer' as const},q.before);}
 @Post(':id/messages') @HttpCode(200) @Throttle({default:{limit:30,ttl:60000}}) reply(@Req() r:LawyerRequest,@Param('id',ParseUUIDPipe) id:string,@Body() q:ReplyTicketDto){return this.support.reply(id,{id:r.lawyer.id,name:r.lawyer.fullName??'Lawyer',role:'lawyer' as const},q.body);}
 @Post(':id/attachments') @UseInterceptors(FileInterceptor('file',{limits:{fileSize:5*1024*1024,files:1}})) upload(@Req() r:LawyerRequest,@Param('id',ParseUUIDPipe) id:string,@UploadedFile() file:Express.Multer.File){return this.support.upload(id,{id:r.lawyer.id,name:r.lawyer.fullName??'Lawyer',role:'lawyer' as const},file);}
 @Get(':id/attachments/:fileId') async file(@Req() r:LawyerRequest,@Param('id',ParseUUIDPipe) id:string,@Param('fileId',ParseUUIDPipe) fileId:string,@Res({passthrough:true}) res:Response){return download(await this.support.attachment(id,fileId,{id:r.lawyer.id,name:r.lawyer.fullName??'Lawyer',role:'lawyer' as const}),res);}
}
