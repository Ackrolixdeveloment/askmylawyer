import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminLawyersController } from './admin-lawyers.controller';
import { AdminLawyersService } from './admin-lawyers.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminLawyersController],
  providers: [AdminLawyersService],
})
export class AdminLawyersModule {}
