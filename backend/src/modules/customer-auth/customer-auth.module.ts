import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '../../config/env';
import { OtpModule } from '../otp/otp.module';
import { SocialTokenService } from '../social-auth/social-token.service';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthGuard } from './customer-auth.guard';
import { CustomerAuthService } from './customer-auth.service';

@Module({
  imports: [JwtModule.register({ secret: env.JWT_ACCESS_SECRET }), OtpModule],
  controllers: [CustomerAuthController],
  providers: [CustomerAuthService, CustomerAuthGuard, SocialTokenService],
  exports: [CustomerAuthService, CustomerAuthGuard, JwtModule],
})
export class CustomerAuthModule {}
