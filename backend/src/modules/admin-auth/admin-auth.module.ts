import { PasswordRecoveryController } from './password-recovery.controller';
import { PasswordRecoveryService } from './password-recovery.service';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '../../config/env';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';

@Module({
  imports: [JwtModule.register({ secret: env.JWT_ACCESS_SECRET })],
  controllers: [AdminAuthController,PasswordRecoveryController],
  providers: [AdminAuthService, AdminAuthGuard,PasswordRecoveryService],
  exports: [AdminAuthService, AdminAuthGuard, JwtModule],
})
export class AdminAuthModule {}
