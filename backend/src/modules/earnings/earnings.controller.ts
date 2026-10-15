import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { LawyerAuthGuard, type LawyerRequest } from '../lawyer-auth/lawyer-auth.guard';
import { EarningsService } from './earnings.service';

/** The lawyer's commission history. */
@Controller('lawyer/earnings')
@UseGuards(LawyerAuthGuard)
export class EarningsController {
  constructor(private readonly earnings: EarningsService) {}

  @Get()
  summary(@Req() request: LawyerRequest) {
    return this.earnings.summary(request.lawyer.id);
  }

  @Get(':id')
  detail(@Req() request: LawyerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.earnings.detail(request.lawyer.id, id);
  }
}
