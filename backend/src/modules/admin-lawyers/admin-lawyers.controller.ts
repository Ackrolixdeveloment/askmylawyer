import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  ParseEnumPipe,
  ParseUUIDPipe,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LawyerDocumentType } from '@prisma/client';
import type { Response } from 'express';
import { AdminAuthGuard, type AdminRequest } from '../admin-auth/admin-auth.guard';
import { AdminLawyersService } from './admin-lawyers.service';
import { ListOnboardingDto } from './dto/list-onboarding.dto';
import {
  RejectLawyerDto,
  RequestCorrectionDto,
  SaveReviewProgressDto,
  SuspendLawyerDto,
} from './dto/review.dto';

@Controller('admin/lawyers')
@UseGuards(AdminAuthGuard)
export class AdminLawyersController {
  constructor(private readonly lawyers: AdminLawyersService) {}

  /** New requests and rejected lawyers (`?status=new|rejected`). */
  @Get('onboarding')
  listOnboarding(@Query() query: ListOnboardingDto) {
    return this.lawyers.listOnboarding(query);
  }

  /** Correction and resubmission queues (`?status=correction|resubmission`). */
  @Get('corrections')
  listCorrections(@Query() query: ListOnboardingDto) {
    return this.lawyers.listCorrections(query);
  }

  /** Registrations started but never submitted. */
  @Get('drafts')
  listDrafts(@Query() query: ListOnboardingDto) {
    return this.lawyers.listDrafts(query);
  }

  /** Approved lawyers. */
  @Get('verified')
  listVerified(@Query() query: ListOnboardingDto) {
    return this.lawyers.listVerified(query);
  }

  /** Removed accounts, kept for the record. */
  @Get('deleted')
  listDeleted(@Query() query: ListOnboardingDto) {
    return this.lawyers.listDeleted(query);
  }

  @Get('summary')
  summary() {
    return this.lawyers.summary();
  }

  /** Everything the review screen shows for one application. */
  @Get(':id/application')
  application(@Param('id', ParseUUIDPipe) id: string) {
    return this.lawyers.application(id);
  }

  /** Saves the ticks, crosses and draft notes for one review step. */
  @Put(':id/review-progress')
  saveReviewProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveReviewProgressDto,
    @Req() request: AdminRequest,
  ) {
    return this.lawyers.saveReviewProgress(id, request.admin.id, dto);
  }

  /** Approve the application and make the lawyer live. */
  @Post(':id/approve')
  @HttpCode(200)
  approve(@Param('id', ParseUUIDPipe) id: string, @Req() request: AdminRequest) {
    return this.lawyers.approve(id, request.admin.id);
  }

  /** Reject it, with a reason the lawyer can read. */
  @Post(':id/reject')
  @HttpCode(200)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectLawyerDto,
    @Req() request: AdminRequest,
  ) {
    return this.lawyers.reject(id, request.admin.id, dto.reason);
  }

  /** Send it back for correction with per-section notes. */
  @Post(':id/request-correction')
  @HttpCode(200)
  requestCorrection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestCorrectionDto,
    @Req() request: AdminRequest,
  ) {
    return this.lawyers.requestCorrection(id, request.admin.id, dto.notes);
  }

  /** Takes the lawyer off the marketplace and signs them out of the app. */
  @Post(':id/suspend')
  @HttpCode(200)
  suspend(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SuspendLawyerDto) {
    return this.lawyers.suspend(id, dto.reason ?? null);
  }

  /** Puts a suspended lawyer back on the marketplace. */
  @Post(':id/reactivate')
  @HttpCode(200)
  reactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.lawyers.reactivate(id);
  }

  /** Streams an uploaded document; `?download=1` saves it instead of previewing. */
  @Get(':id/documents/:type')
  async document(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('type', new ParseEnumPipe(LawyerDocumentType)) type: LawyerDocumentType,
    @Query('download') download: string | undefined,
    @Res() response: Response,
  ) {
    const { document, body } = await this.lawyers.document(id, type);
    const disposition = download === '1' ? 'attachment' : 'inline';

    response
      .setHeader('Content-Type', document.mimeType)
      .setHeader(
        'Content-Disposition',
        `${disposition}; filename="${encodeURIComponent(document.originalName)}"`,
      )
      .setHeader('Cache-Control', 'private, no-store')
      .send(body);
  }
}
