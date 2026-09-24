import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { env } from './config/env';
import { MailModule } from './infrastructure/mail/mail.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { PushModule } from './infrastructure/push/push.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { LawyerRegistrationModule } from './modules/lawyer-registration/lawyer-registration.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminAlertsModule } from './modules/admin-alerts/admin-alerts.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { AdminEditRequestsModule } from './modules/admin-edit-requests/admin-edit-requests.module';
import { AdminLawyersModule } from './modules/admin-lawyers/admin-lawyers.module';
import { AdminNotificationsModule } from './modules/admin-notifications/admin-notifications.module';
import { AdminUsersModule } from './modules/admin-users/admin-users.module';
import { DevicesModule } from './modules/devices/devices.module';
import { UserNotificationsModule } from './modules/lawyer-notifications/user-notifications.module';
import { LawyerAccountModule } from './modules/lawyer-account/lawyer-account.module';
import { LawyerAuthModule } from './modules/lawyer-auth/lawyer-auth.module';
import { LawyerProfileModule } from './modules/lawyer-profile/lawyer-profile.module';

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
    // Runs the worker that sends scheduled notifications.
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
    StorageModule,
    PushModule,
    NotificationsModule,
    AdminAuthModule,
    AdminAlertsModule,
    AdminLawyersModule,
    AdminEditRequestsModule,
    AdminNotificationsModule,
    AdminUsersModule,
    DevicesModule,
    UserNotificationsModule,
    LawyerAuthModule,
    LawyerAccountModule,
    LawyerProfileModule,
    LawyerRegistrationModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
