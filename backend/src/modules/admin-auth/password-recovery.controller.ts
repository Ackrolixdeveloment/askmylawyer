import { Body,Controller,HttpCode,Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail,IsString,IsUUID,Length,Matches } from 'class-validator';
import { PasswordRecoveryService } from './password-recovery.service';
class RequestReset { @IsEmail() @Length(1,255) email:string; }
class VerifyReset { @IsUUID() challengeId:string; @Matches(/^\d{6}$/) otp:string; }
class FinishReset { @IsUUID() challengeId:string; @Matches(/^[a-f0-9]{64}$/) resetToken:string; @IsString() @Length(8,128) password:string; }
@Controller('admin/auth/password')
export class PasswordRecoveryController {
 constructor(private readonly recovery:PasswordRecoveryService){}
 @Post('request') @HttpCode(200) @Throttle({default:{limit:5,ttl:60000}}) request(@Body() q:RequestReset){return this.recovery.request(q.email);}
 @Post('verify') @HttpCode(200) @Throttle({default:{limit:10,ttl:60000}}) verify(@Body() q:VerifyReset){return this.recovery.verifyCode(q.challengeId,q.otp);}
 @Post('reset') @HttpCode(200) @Throttle({default:{limit:5,ttl:60000}}) reset(@Body() q:FinishReset){return this.recovery.reset(q.challengeId,q.resetToken,q.password);}
}
