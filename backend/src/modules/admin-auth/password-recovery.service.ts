import { Cron } from '@nestjs/schedule';
import { Injectable,HttpStatus } from '@nestjs/common';
import { randomUUID,randomInt,randomBytes,createHmac,timingSafeEqual } from 'node:crypto';
import { hash,verify } from '@node-rs/argon2';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { env } from '../../config/env';
import { AppException } from '../../common/app-exception';
const invalid=()=>new AppException(HttpStatus.BAD_REQUEST,'INVALID_RESET','This recovery code or link is invalid or expired. Request a new code.');
@Injectable()
export class PasswordRecoveryService {
 constructor(private readonly prisma:PrismaService,private readonly mail:MailService){}
 @Cron('0 20 3 * * *')
 async cleanExpired(){await this.prisma.adminPasswordReset.deleteMany({where:{expiresAt:{lt:new Date(Date.now()-30*86400000)}}});}
 private digest(value:string){return createHmac('sha256',env.JWT_ACCESS_SECRET).update(value).digest('hex');}
 private equal(a:string,b:string){const x=Buffer.from(a,'hex'),y=Buffer.from(b,'hex');return x.length===y.length&&timingSafeEqual(x,y);}
 async request(email:string){
  const admin=await this.prisma.adminUser.findFirst({where:{email:email.trim().toLowerCase(),status:'active',deletedAt:null},select:{id:true}});
  let challengeId:string=randomUUID();
  if(admin){
   const recent=await this.prisma.adminPasswordReset.findFirst({where:{adminId:admin.id,createdAt:{gt:new Date(Date.now()-60000)},consumedAt:null,expiresAt:{gt:new Date()}},orderBy:{createdAt:'desc'}});
   if(recent)return {challengeId:recent.id,message:'If this account is eligible, a recovery code has been sent.'};
   const otp=String(randomInt(100000,1000000));
   await this.prisma.$transaction(async tx=>{await tx.adminPasswordReset.updateMany({where:{adminId:admin.id,consumedAt:null},data:{consumedAt:new Date()}});await tx.adminPasswordReset.create({data:{id:challengeId,adminId:admin.id,codeHash:this.digest(challengeId+':'+otp),expiresAt:new Date(Date.now()+10*60000)}});});
   try{await this.mail.send({to:email.trim().toLowerCase(),subject:'Ask My Lawyer admin password recovery',text:`Your recovery code is ${otp}. It expires in 10 minutes. If you did not request it, ignore this email.`,html:`<p>Your recovery code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes. If you did not request it, ignore this email.</p>`});}catch{await this.prisma.adminPasswordReset.updateMany({where:{id:challengeId},data:{consumedAt:new Date()}});challengeId=randomUUID();}
  }
  return {challengeId,message:'If this account is eligible, a recovery code has been sent.'};
 }
 async verifyCode(challengeId:string,otp:string){
  const row=await this.prisma.adminPasswordReset.findUnique({where:{id:challengeId}});
  if(!row||row.consumedAt||row.verifiedAt||row.expiresAt<=new Date()||row.attempts>=5)throw invalid();
  if(!this.equal(row.codeHash,this.digest(challengeId+':'+otp))){await this.prisma.adminPasswordReset.updateMany({where:{id:challengeId,attempts:{lt:5},verifiedAt:null,consumedAt:null},data:{attempts:{increment:1}}});throw invalid();}
  const resetToken=randomBytes(32).toString('hex');
  const changed=await this.prisma.adminPasswordReset.updateMany({where:{id:challengeId,consumedAt:null,verifiedAt:null,attempts:{lt:5},expiresAt:{gt:new Date()}},data:{verifiedAt:new Date(),tokenHash:this.digest(resetToken)}});
  if(changed.count!==1)throw invalid();return {resetToken};
 }
 async reset(challengeId:string,resetToken:string,password:string){
  const row=await this.prisma.adminPasswordReset.findUnique({where:{id:challengeId},include:{admin:true}});
  if(!row||!row.verifiedAt||!row.tokenHash||row.consumedAt||row.expiresAt<=new Date()||row.admin.deletedAt||row.admin.status!=='active'||!this.equal(row.tokenHash,this.digest(resetToken)))throw invalid();
  if(await verify(row.admin.passwordHash,password))throw new AppException(HttpStatus.BAD_REQUEST,'PASSWORD_REUSED','Choose a different password.');
  const passwordHash=await hash(password);
  await this.prisma.$transaction(async tx=>{
   const claimed=await tx.adminPasswordReset.updateMany({where:{id:challengeId,consumedAt:null,expiresAt:{gt:new Date()},tokenHash:row.tokenHash},data:{consumedAt:new Date(),tokenHash:null}});
   if(claimed.count!==1)throw invalid();
   await tx.adminUser.update({where:{id:row.adminId},data:{passwordHash,failedLoginCount:0,lockedUntil:null}});
   await tx.adminSession.updateMany({where:{adminUserId:row.adminId,revokedAt:null},data:{revokedAt:new Date()}});
   await tx.adminPasswordReset.updateMany({where:{adminId:row.adminId,consumedAt:null},data:{consumedAt:new Date(),tokenHash:null}});
  });return {success:true};
 }
}
