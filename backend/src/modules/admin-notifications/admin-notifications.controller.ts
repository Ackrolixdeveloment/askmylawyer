import { Body, Controller, Get, HttpCode, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AdminAuthGuard, type AdminRequest } from '../admin-auth/admin-auth.guard';
import { AdminNotificationsService } from './admin-notifications.service';
import {
  ListNotificationsDto,
  SearchRecipientsDto,
  SendNotificationDto,
} from './dto/notification.dto';

/** Broadcasts and one-to-one notifications from the admin panel. */
@Controller('admin/notifications')
@UseGuards(AdminAuthGuard)
export class AdminNotificationsController {
  constructor(private readonly notifications: AdminNotificationsService) {}

  /** What has been sent, newest first. */
  @Get()
  list(@Query() query: ListNotificationsDto) {
    return this.notifications.list(query);
  }

  /** How many people and phones each audience covers. */
  @Get('audience')
  audience() {
    return this.notifications.audience();
  }

  /** Type-ahead when sending to one person. */
  @Get('recipients')
  recipients(@Query() query: SearchRecipientsDto) {
    return this.notifications.recipients(query);
  }

  @Post()
  @HttpCode(200)
  send(@Req() request: AdminRequest, @Body() dto: SendNotificationDto) {
    return this.notifications.send(request.admin.id, dto);
  }
}
