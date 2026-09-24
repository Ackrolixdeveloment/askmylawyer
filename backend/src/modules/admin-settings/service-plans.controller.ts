import { Controller, Get } from '@nestjs/common';
import { AdminSettingsService } from './admin-settings.service';

/**
 * The plans on offer, for the lawyer and customer apps.
 *
 * Open to anyone: the customer app shows them before sign-in, and nothing
 * here is private — it is a price list.
 */
@Controller('plans')
export class ServicePlansController {
  constructor(private readonly settings: AdminSettingsService) {}

  @Get()
  list() {
    return this.settings.publicPlans();
  }
}
