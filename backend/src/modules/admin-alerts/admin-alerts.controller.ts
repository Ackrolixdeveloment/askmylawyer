import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard, type AdminRequest } from '../admin-auth/admin-auth.guard';
import { AdminAlertsService } from './admin-alerts.service';
import { AdminEventsService } from './admin-events.service';
import { BrowserTokenDto } from './dto/browser-token.dto';
import { DeleteAlertsDto } from './dto/delete-alerts.dto';

/** The bell in the admin panel, and the live channel that feeds it. */
@Controller('admin/alerts')
@UseGuards(AdminAuthGuard)
export class AdminAlertsController {
  constructor(
    private readonly alerts: AdminAlertsService,
    private readonly events: AdminEventsService,
  ) {}

  /**
   * Server-sent events for this admin: a new alert, or a change to what they
   * are allowed to reach. The panel reacts without polling.
   */
  @Sse('stream')
  stream(@Req() request: AdminRequest) {
    return this.events.streamFor(request.admin.id);
  }

  /** Lets this browser receive desktop notifications. */
  @Post('browser')
  @HttpCode(200)
  registerBrowser(@Req() request: AdminRequest, @Body() dto: BrowserTokenDto) {
    return this.alerts.registerBrowser(
      request.admin.id,
      dto.token,
      request.headers['user-agent'],
    );
  }

  /** Called on sign-out, so the browser stops receiving their alerts. */
  @Delete('browser')
  @HttpCode(200)
  unregisterBrowser(@Req() request: AdminRequest, @Body() dto: BrowserTokenDto) {
    return this.alerts.unregisterBrowser(request.admin.id, dto.token);
  }

  /** What the bell shows when it is opened. */
  @Get('unread')
  unread(@Req() request: AdminRequest, @Query('take') take?: string) {
    const count = Number(take);
    return this.alerts.unread(
      request.admin.id,
      Number.isFinite(count) && count > 0 ? Math.min(count, 20) : 5,
    );
  }

  @Get()
  list(@Req() request: AdminRequest) {
    return this.alerts.list(request.admin.id);
  }

  /** Removes the chosen notifications, or every one of them. */
  @Post('delete')
  @HttpCode(200)
  remove(@Req() request: AdminRequest, @Body() dto: DeleteAlertsDto) {
    return this.alerts.remove(request.admin.id, dto.ids);
  }

  @Delete(':id')
  @HttpCode(200)
  removeOne(@Req() request: AdminRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.alerts.remove(request.admin.id, [id]);
  }

  @Post('read')
  @HttpCode(200)
  markAllRead(@Req() request: AdminRequest) {
    return this.alerts.markRead(request.admin.id);
  }

  @Post(':id/read')
  @HttpCode(200)
  markRead(@Req() request: AdminRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.alerts.markRead(request.admin.id, id);
  }
}
