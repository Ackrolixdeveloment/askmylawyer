import { Body, Controller, Get, HttpCode, Post, Put, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CustomerAuthGuard, type CustomerRequest } from './customer-auth.guard';
import { CustomerAuthService, toCustomerResponse } from './customer-auth.service';
import { RefreshDto, SendOtpDto, UpdateProfileDto, VerifyOtpDto } from './dto/auth.dto';

const clientInfo = (request: Request) => ({
  ip: request.ip,
  userAgent: request.headers['user-agent'],
});

/** Sign-in for the customer app: a code on the mobile number, nothing else. */
@Controller('customer/auth')
export class CustomerAuthController {
  constructor(private readonly auth: CustomerAuthService) {}

  @Post('otp/send')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.auth.sendMobileOtp(dto.mobile);
  }

  @Post('otp/verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() request: Request) {
    return this.auth.verifyMobileOtp(dto.mobile, dto.otp, clientInfo(request));
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto, @Req() request: Request) {
    return this.auth.refresh(dto.refreshToken, clientInfo(request));
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Body() dto: RefreshDto) {
    await this.auth.logout(dto.refreshToken);
    return { success: true };
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  me(@Req() request: CustomerRequest) {
    return { customer: toCustomerResponse(request.customer) };
  }

  @Put('profile')
  @UseGuards(CustomerAuthGuard)
  updateProfile(@Req() request: CustomerRequest, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(request.customer.id, dto.fullName, dto.email);
  }
}
