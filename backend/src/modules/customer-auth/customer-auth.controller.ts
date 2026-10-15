import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CustomerAuthGuard, type CustomerRequest } from './customer-auth.guard';
import { CustomerAuthService, toCustomerResponse } from './customer-auth.service';
import {
  AppleLoginDto,
  GoogleLoginDto,
  RefreshDto,
  SendEmailOtpDto,
  SendOtpDto,
  VerifyEmailOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import {
  ChangeContactDto,
  UpdateCustomerProfileDto,
  VerifyContactDto,
} from './dto/profile.dto';

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

  /** The same sign-in, by email. Either one reaches the same account. */
  @Post('email/send')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  sendEmailOtp(@Body() dto: SendEmailOtpDto) {
    return this.auth.sendEmailOtp(dto.email);
  }

  @Post('email/verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyEmailOtp(@Body() dto: VerifyEmailOtpDto, @Req() request: Request) {
    return this.auth.verifyEmailOtp(dto.email, dto.otp, clientInfo(request));
  }

  @Post('google')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  google(@Body() dto: GoogleLoginDto, @Req() request: Request) {
    return this.auth.loginWithGoogle(dto.idToken, clientInfo(request));
  }

  @Post('apple')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  apple(@Body() dto: AppleLoginDto, @Req() request: Request) {
    return this.auth.loginWithApple(
      dto.identityToken,
      dto.rawNonce,
      dto.fullName,
      clientInfo(request),
    );
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

  /** Everything the profile screen shows. */
  @Get('profile')
  @UseGuards(CustomerAuthGuard)
  profile(@Req() request: CustomerRequest) {
    return this.auth.profile(request.customer.id);
  }

  @Put('profile')
  @UseGuards(CustomerAuthGuard)
  updateProfile(
    @Req() request: CustomerRequest,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    return this.auth.updateProfile(request.customer.id, dto);
  }

  /**
   * Changing the email or mobile already on the account takes a code sent
   * to the new one. Adding the one they are missing does not, and goes
   * through `PUT profile` like anything else.
   */
  @Post('profile/contact/send')
  @HttpCode(200)
  @UseGuards(CustomerAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  sendContactOtp(@Req() request: CustomerRequest, @Body() dto: ChangeContactDto) {
    return this.auth.sendContactOtp(request.customer.id, dto);
  }

  @Post('profile/contact/verify')
  @HttpCode(200)
  @UseGuards(CustomerAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyContactOtp(@Req() request: CustomerRequest, @Body() dto: VerifyContactDto) {
    return this.auth.verifyContactOtp(request.customer.id, dto);
  }

  @Post('profile/photo')
  @UseGuards(CustomerAuthGuard)
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 5 * 1024 * 1024 } }))
  savePhoto(@Req() request: CustomerRequest, @UploadedFile() photo: Express.Multer.File) {
    return this.auth.savePhoto(request.customer.id, photo);
  }

  /** Their own photo. Private, so it is served rather than linked publicly. */
  @Get('profile/photo')
  @UseGuards(CustomerAuthGuard)
  async photo(@Req() request: CustomerRequest, @Res() response: Response) {
    const { body, mimeType } = await this.auth.photo(request.customer.id);
    response
      .setHeader('Content-Type', mimeType)
      .setHeader('Cache-Control', 'private, no-store')
      .send(body);
  }
}
