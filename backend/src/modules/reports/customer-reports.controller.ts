import { Controller, Get, Header, StreamableFile, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { CustomerAuthGuard, type CustomerRequest } from '../customer-auth/customer-auth.guard';
import { ReportsService } from './reports.service';

/** The client's side of the consultation report. */
@Controller('customer/consultations/:id/report')
@UseGuards(CustomerAuthGuard)
export class CustomerReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Cache-Control', 'private, no-store')
  @Header('Content-Disposition', 'attachment; filename="consultation-report.pdf"')
  async pdf(@Req() request: CustomerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return new StreamableFile(await this.reports.pdf(request.customer.id, id));
  }

  /**
   * The report, once the lawyer has sent it and anything owed for extra
   * call time has been settled. Until then it explains what is happening.
   */
  @Get()
  get(@Req() request: CustomerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.reports.forCustomer(request.customer.id, id);
  }
}
