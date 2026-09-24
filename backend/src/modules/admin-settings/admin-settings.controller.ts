import { Body, Controller, Get, HttpCode, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AdminAuthGuard, type AdminRequest } from '../admin-auth/admin-auth.guard';
import { AdminSettingsService } from './admin-settings.service';
import { ApplyProfileDto, EngineSettingsDto } from './dto/engine.dto';
import { SaveGatewayDto } from './dto/gateway.dto';
import { EngineSettingsService } from './engine-settings.service';
import { SavePlansDto } from './dto/plan.dto';
import { PaymentGatewayService } from './payment-gateway.service';

/** Settings: consultation pricing, and the gateway that collects it. */
@Controller('admin/settings')
@UseGuards(AdminAuthGuard)
export class AdminSettingsController {
  constructor(
    private readonly settings: AdminSettingsService,
    private readonly gateway: PaymentGatewayService,
    private readonly engine: EngineSettingsService,
  ) {}

  @Get('plans')
  plans() {
    return this.settings.plans();
  }

  @Put('plans')
  savePlans(@Body() dto: SavePlansDto) {
    return this.settings.savePlans(dto);
  }

  // ---- Consultation engine ----

  /**
   * Whether the demo profile is on. Open to any signed-in admin: the banner
   * warning that every consultation is being broadcast has to be visible to
   * everyone, not only whoever may edit the settings.
   */
  @Get('engine/status')
  engineStatus() {
    return this.engine.status();
  }

  @Get('engine')
  engineSettings() {
    return this.engine.get();
  }

  @Put('engine')
  saveEngineSettings(@Req() request: AdminRequest, @Body() dto: EngineSettingsDto) {
    return this.engine.save(request.admin.id, dto);
  }

  /** Sets the whole demo or production profile in one click. */
  @Post('engine/profile')
  @HttpCode(200)
  applyEngineProfile(@Req() request: AdminRequest, @Body() dto: ApplyProfileDto) {
    return this.engine.applyProfile(request.admin.id, dto.profile);
  }

  /** Cashfree keys, and whether the apps are on test or live. */
  @Get('payments')
  paymentGateway() {
    return this.gateway.get();
  }

  @Put('payments')
  savePaymentGateway(@Body() dto: SaveGatewayDto) {
    return this.gateway.save(dto);
  }
}
