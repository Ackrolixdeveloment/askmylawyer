import { Module } from '@nestjs/common';
import { LawyerAuthModule } from '../lawyer-auth/lawyer-auth.module';
import { EarningsController } from './earnings.controller';
import { EarningsService } from './earnings.service';

@Module({
  imports: [LawyerAuthModule],
  controllers: [EarningsController],
  providers: [EarningsService],
})
export class EarningsModule {}
