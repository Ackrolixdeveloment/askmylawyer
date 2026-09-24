import { Global, Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminAlertsController } from './admin-alerts.controller';
import { AdminAlertsService } from './admin-alerts.service';
import { AdminEventsService } from './admin-events.service';

/**
 * Global: anything that happens anywhere in the backend may need to raise an
 * alert for the admin team.
 */
@Global()
@Module({
  imports: [AdminAuthModule],
  controllers: [AdminAlertsController],
  providers: [AdminAlertsService, AdminEventsService],
  exports: [AdminAlertsService, AdminEventsService],
})
export class AdminAlertsModule {}
