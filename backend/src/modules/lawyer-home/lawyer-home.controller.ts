import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, Req, UseGuards } from '@nestjs/common';
import { LawyerAuthGuard, type LawyerRequest } from '../lawyer-auth/lawyer-auth.guard';
import { LawyerHomeService } from './lawyer-home.service';

/** The lawyer's dashboard. */
@Controller('lawyer/home')
@UseGuards(LawyerAuthGuard)
export class LawyerHomeController {
  constructor(private readonly home: LawyerHomeService) {}

  @Get()
  dashboard(@Req() request: LawyerRequest) {
    return this.home.dashboard(request.lawyer.id);
  }

  /**
   * The full activity list, a page at a time. Pass the `nextCursor` from
   * the previous page to carry on.
   */
  @Get('activity')
  activity(
    @Req() request: LawyerRequest,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    return this.home.activityPage(request.lawyer.id, cursor, Math.min(limit, 50));
  }
}
