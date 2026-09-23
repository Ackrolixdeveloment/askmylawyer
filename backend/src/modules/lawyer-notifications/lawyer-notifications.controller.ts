import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LawyerAuthGuard, type LawyerRequest } from '../lawyer-auth/lawyer-auth.guard';
import { UserNotificationsService } from './user-notifications.service';

/** The lawyer app's notification list. */
@Controller('lawyer/notifications')
@UseGuards(LawyerAuthGuard)
export class LawyerNotificationsController {
  constructor(private readonly notifications: UserNotificationsService) {}

  /** `?after=<ISO datetime>` returns only what has arrived since. */
  @Get()
  list(@Req() request: LawyerRequest, @Query('after') after?: string) {
    let since: Date | undefined;
    if (after) {
      since = new Date(after);
      if (Number.isNaN(since.getTime())) {
        throw new BadRequestException('`after` must be an ISO datetime.');
      }
    }

    return this.notifications.list(request.lawyer.id, since);
  }

  /** Drives the badge on the bell. */
  @Get('unread-count')
  unreadCount(@Req() request: LawyerRequest) {
    return this.notifications.unreadCount(request.lawyer.id);
  }

  @Post('read')
  @HttpCode(200)
  markAllRead(@Req() request: LawyerRequest) {
    return this.notifications.markRead(request.lawyer.id);
  }

  @Post(':id/read')
  @HttpCode(200)
  markRead(@Req() request: LawyerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.markRead(request.lawyer.id, id);
  }
}
