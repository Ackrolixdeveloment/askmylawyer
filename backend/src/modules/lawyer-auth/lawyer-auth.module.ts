import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '../../config/env';
import { OtpModule } from '../otp/otp.module';
import { SocialTokenService } from '../social-auth/social-token.service';
import { LawyerAuthController } from './lawyer-auth.controller';
import { LawyerAuthGuard } from './lawyer-auth.guard';
import { LawyerAuthService } from './lawyer-auth.service';

@Module({
  imports: [JwtModule.register({ secret: env.JWT_ACCESS_SECRET }), OtpModule],
  controllers: [LawyerAuthController],
  providers: [LawyerAuthService, LawyerAuthGuard, SocialTokenService],
  exports: [LawyerAuthService, LawyerAuthGuard, JwtModule],
})
export class LawyerAuthModule {}
