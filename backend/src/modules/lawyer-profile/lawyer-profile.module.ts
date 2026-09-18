import { Module } from '@nestjs/common';
import { LawyerAuthModule } from '../lawyer-auth/lawyer-auth.module';
import { LawyerProfileController } from './lawyer-profile.controller';
import { LawyerProfileService } from './lawyer-profile.service';

@Module({
  imports: [LawyerAuthModule],
  controllers: [LawyerProfileController],
  providers: [LawyerProfileService],
})
export class LawyerProfileModule {}
