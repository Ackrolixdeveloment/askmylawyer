import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  AppleLoginDto,
  GoogleLoginDto,
  RefreshTokenDto,
  SendEmailOtpDto,
  SendOtpDto,
  VerifyEmailOtpDto,
  VerifyOtpDto,
} from './dto/lawyer-auth.dto';
import { LawyerAuthGuard, type LawyerRequest } from './lawyer-auth.guard';
import { LawyerAuthService, toLawyerResponse } from './lawyer-auth.service';

const clientInfo = (request: Request) => ({
  ip: request.ip,
  userAgent: request.headers['user-agent'],
});

const SEND_LIMIT = { default: { limit: 5, ttl: 60_000 } };
const LOGIN_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@Controller('lawyer/auth')
export class LawyerAuthController {
  constructor(private readonly auth: LawyerAuthService) {}

  // ---- 1. Mobile OTP ----

  @Post('otp/send')
  @HttpCode(200)
  @Throttle(SEND_LIMIT)
  sendMobileOtp(@Body() dto: SendOtpDto) {
    return this.auth.sendMobileOtp(dto.mobile);
  }

  @Post('otp/verify')
  @HttpCode(200)
  @Throttle(LOGIN_LIMIT)
  verifyMobileOtp(@Body() dto: VerifyOtpDto, @Req() request: Request) {
    return this.auth.verifyMobileOtp(dto.mobile, dto.otp, clientInfo(request));
  }

  // ---- 2. Email OTP ----

  @Post('email/otp/send')
  @HttpCode(200)
  @Throttle(SEND_LIMIT)
  sendEmailOtp(@Body() dto: SendEmailOtpDto) {
    return this.auth.sendEmailOtp(dto.email);
  }

  @Post('email/otp/verify')
  @HttpCode(200)
  @Throttle(LOGIN_LIMIT)
  verifyEmailOtp(@Body() dto: VerifyEmailOtpDto, @Req() request: Request) {
    return this.auth.verifyEmailOtp(dto.email, dto.otp, clientInfo(request));
  }

  // ---- 3. Google ----

  @Post('google')
  @HttpCode(200)
  @Throttle(LOGIN_LIMIT)
  google(@Body() dto: GoogleLoginDto, @Req() request: Request) {
    return this.auth.loginWithGoogle(dto.idToken, clientInfo(request));
  }

  // ---- 4. Apple (iOS) ----

  @Post('apple')
  @HttpCode(200)
  @Throttle(LOGIN_LIMIT)
  apple(@Body() dto: AppleLoginDto, @Req() request: Request) {
    return this.auth.loginWithApple(
      dto.identityToken,
      dto.rawNonce,
      dto.fullName,
      clientInfo(request),
    );
  }

  // ---- Session ----

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    return this.auth.refresh(dto.refreshToken, clientInfo(request));
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.auth.logout(dto.refreshToken);
    return { success: true };
  }

  @Get('me')
  @UseGuards(LawyerAuthGuard)
  me(@Req() request: LawyerRequest) {
    return { lawyer: toLawyerResponse(request.lawyer) };
  }
}
