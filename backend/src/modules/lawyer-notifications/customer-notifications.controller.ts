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
import { CustomerAuthGuard, type CustomerRequest } from '../customer-auth/customer-auth.guard';
import { UserNotificationsService } from './user-notifications.service';

/** The customer app's notification list. */
@Controller('customer/notifications')
@UseGuards(CustomerAuthGuard)
export class CustomerNotificationsController {
  constructor(private readonly notifications: UserNotificationsService) {}

  /** `?after=<ISO datetime>` returns only what has arrived since. */
  @Get()
  list(@Req() request: CustomerRequest, @Query('after') after?: string) {
    let since: Date | undefined;
    if (after) {
      since = new Date(after);
      if (Number.isNaN(since.getTime())) {
        throw new BadRequestException('`after` must be an ISO datetime.');
      }
    }

    return this.notifications.list(request.customer.id, since);
  }

  /** Drives the badge on the bell. */
  @Get('unread-count')
  unreadCount(@Req() request: CustomerRequest) {
    return this.notifications.unreadCount(request.customer.id);
  }

  @Post('read')
  @HttpCode(200)
  markAllRead(@Req() request: CustomerRequest) {
    return this.notifications.markRead(request.customer.id);
  }

  @Post(':id/read')
  @HttpCode(200)
  markRead(@Req() request: CustomerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.markRead(request.customer.id, id);
  }
}
