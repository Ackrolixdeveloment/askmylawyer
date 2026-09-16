import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { env } from './config/env';
import { MailModule } from './infrastructure/mail/mail.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { LawyerRegistrationModule } from './modules/lawyer-registration/lawyer-registration.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { AdminLawyersModule } from './modules/admin-lawyers/admin-lawyers.module';
import { LawyerAccountModule } from './modules/lawyer-account/lawyer-account.module';
import { LawyerAuthModule } from './modules/lawyer-auth/lawyer-auth.module';

@Controller('health')
class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: env.LOG_LEVEL,
        transport: env.LOG_FORMAT === 'pretty' ? { target: 'pino-pretty' } : undefined,
        // Never write secrets to the logs (CloudWatch included).
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          'req.body.password',
          'req.body.otp',
          'req.body.refreshToken',
          'req.body.idToken',
          'req.body.identityToken',
          'req.body.rawNonce',
          'req.body.aadhaarNumber',
          'req.body.accountNumber',
          'req.body.confirmAccountNumber',
        ],
      },
    }),
    ThrottlerModule.forRoot([{ limit: 100, ttl: 60_000 }]),
    PrismaModule,
    MailModule,
    StorageModule,
    NotificationsModule,
    AdminAuthModule,
    AdminLawyersModule,
    LawyerAuthModule,
    LawyerAccountModule,
    LawyerRegistrationModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
