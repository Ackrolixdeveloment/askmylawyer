import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard, type AdminRequest } from '../admin-auth/admin-auth.guard';
import { AdminNotificationsService } from './admin-notifications.service';
import {
  ListNotificationsDto,
  SearchRecipientsDto,
  SendNotificationDto,
} from './dto/notification.dto';
import { ListScheduledDto, ScheduleNotificationDto } from './dto/scheduled.dto';
import { ScheduledNotificationsService } from './scheduled-notifications.service';

/** Broadcasts and one-to-one notifications from the admin panel. */
@Controller('admin/notifications')
@UseGuards(AdminAuthGuard)
export class AdminNotificationsController {
  constructor(
    private readonly notifications: AdminNotificationsService,
    private readonly scheduled: ScheduledNotificationsService,
  ) {}

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

  // ---- Queued for later ----

  /** Declared before any `:id` route, so the word is not read as one. */
  @Get('scheduled')
  listScheduled(@Query() query: ListScheduledDto) {
    return this.scheduled.list(query);
  }

  @Post('scheduled')
  @HttpCode(201)
  schedule(@Req() request: AdminRequest, @Body() dto: ScheduleNotificationDto) {
    return this.scheduled.create(request.admin.id, dto);
  }

  @Get('scheduled/:id')
  getScheduled(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduled.get(id);
  }

  @Put('scheduled/:id')
  updateScheduled(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleNotificationDto,
  ) {
    return this.scheduled.update(id, dto);
  }

  @Post('scheduled/:id/cancel')
  @HttpCode(200)
  cancelScheduled(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduled.cancel(id);
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
