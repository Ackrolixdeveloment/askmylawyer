import { Module } from '@nestjs/common';
import { LawyerAuthModule } from '../lawyer-auth/lawyer-auth.module';
import { LawyerHomeController } from './lawyer-home.controller';
import { LawyerHomeService } from './lawyer-home.service';

@Module({
  imports: [LawyerAuthModule],
  controllers: [LawyerHomeController],
  providers: [LawyerHomeService],
})
export class LawyerHomeModule {}
