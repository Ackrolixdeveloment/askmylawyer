import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { LawyerAuthGuard, type LawyerRequest } from '../lawyer-auth/lawyer-auth.guard';
import { SubmitReportDto } from './dto/report.dto';
import { ReportsService } from './reports.service';

/** Checking and sending the consultation report. */
@Controller('lawyer/consultations/:id/report')
@UseGuards(LawyerAuthGuard)
export class LawyerReportsController {
  constructor(private readonly reports: ReportsService) {}

  /** Polled by the waiting screen until the draft is ready. */
  @Get()
  get(@Req() request: LawyerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.reports.forLawyer(request.lawyer.id, id);
  }

  /** Keeps the lawyer's edits without sending them. */
  @Put()
  save(
    @Req() request: LawyerRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitReportDto,
  ) {
    return this.reports.save(request.lawyer.id, id, dto);
  }

  /** Sends it to the client, and releases the lawyer's earnings. */
  @Post('submit')
  @HttpCode(200)
  submit(
    @Req() request: LawyerRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitReportDto,
  ) {
    return this.reports.submit(request.lawyer.id, id, dto);
  }

  /** A longer look, if the settings allow one. */
  @Post('more-time')
  @HttpCode(200)
  moreTime(@Req() request: LawyerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.reports.askForLonger(request.lawyer.id, id);
  }
}
