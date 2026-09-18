import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminEditRequestsController } from './admin-edit-requests.controller';
import { AdminEditRequestsService } from './admin-edit-requests.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminEditRequestsController],
  providers: [AdminEditRequestsService],
})
export class AdminEditRequestsModule {}
