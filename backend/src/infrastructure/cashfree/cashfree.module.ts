import { Module } from '@nestjs/common';
import { AdminSettingsModule } from '../../modules/admin-settings/admin-settings.module';
import { CashfreeService } from './cashfree.service';

/** The Cashfree client, which reads its keys from the admin settings. */
@Module({
  imports: [AdminSettingsModule],
  providers: [CashfreeService],
  exports: [CashfreeService],
})
export class CashfreeModule {}
