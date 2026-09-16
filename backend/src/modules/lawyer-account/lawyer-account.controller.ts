import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LawyerAuthGuard, type LawyerRequest } from '../lawyer-auth/lawyer-auth.guard';
import {
  EmailDto,
  MobileDto,
  VerifyEmailDto,
  VerifyMobileDto,
} from './dto/identity.dto';
import { LawyerAccountService } from './lawyer-account.service';

const SEND_LIMIT = { default: { limit: 5, ttl: 60_000 } };
const VERIFY_LIMIT = { default: { limit: 10, ttl: 60_000 } };

/** Adding or changing the mobile number and email on a lawyer's account. */
@Controller('lawyer/account')
@UseGuards(LawyerAuthGuard)
export class LawyerAccountController {
  constructor(private readonly account: LawyerAccountService) {}

  @Post('mobile/otp/send')
  @HttpCode(200)
  @Throttle(SEND_LIMIT)
  sendMobileOtp(@Req() request: LawyerRequest, @Body() dto: MobileDto) {
    return this.account.sendMobileOtp(request.lawyer.id, dto.mobile);
  }

  @Post('mobile/verify')
  @HttpCode(200)
  @Throttle(VERIFY_LIMIT)
  verifyMobile(@Req() request: LawyerRequest, @Body() dto: VerifyMobileDto) {
    return this.account.verifyMobile(request.lawyer.id, dto.mobile, dto.otp);
  }

  @Post('email/otp/send')
  @HttpCode(200)
  @Throttle(SEND_LIMIT)
  sendEmailOtp(@Req() request: LawyerRequest, @Body() dto: EmailDto) {
    return this.account.sendEmailOtp(request.lawyer.id, dto.email);
  }

  @Post('email/verify')
  @HttpCode(200)
  @Throttle(VERIFY_LIMIT)
  verifyEmail(@Req() request: LawyerRequest, @Body() dto: VerifyEmailDto) {
    return this.account.verifyEmail(request.lawyer.id, dto.email, dto.otp);
  }
}
