import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdminAuthGuard, type AdminRequest } from '../admin-auth/admin-auth.guard';
import { AdminEditRequestsService } from './admin-edit-requests.service';
import { ListEditRequestsDto, RejectEditRequestDto } from './dto/edit-request.dto';

@Controller('admin/edit-requests')
@UseGuards(AdminAuthGuard)
export class AdminEditRequestsController {
  constructor(private readonly requests: AdminEditRequestsService) {}

  /** Pending, approved or rejected changes (`?status=`). */
  @Get()
  list(@Query() query: ListEditRequestsDto) {
    return this.requests.list(query.status);
  }

  /** Declared before `:id` so the word "history" is not read as an id. */
  @Get('history')
  history() {
    return this.requests.history();
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.requests.detail(id);
  }

  /** Streams the cancelled cheque submitted with the request. */
  @Get(':id/proof')
  async proof(@Param('id', ParseUUIDPipe) id: string, @Res() response: Response) {
    const { body, name, mimeType } = await this.requests.proof(id);

    response
      .setHeader('Content-Type', mimeType)
      .setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(name)}"`)
      .setHeader('Cache-Control', 'private, no-store')
      .send(body);
  }

  @Post(':id/approve')
  @HttpCode(200)
  approve(@Param('id', ParseUUIDPipe) id: string, @Req() request: AdminRequest) {
    return this.requests.approve(id, request.admin.id);
  }

  @Post(':id/reject')
  @HttpCode(200)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectEditRequestDto,
    @Req() request: AdminRequest,
  ) {
    return this.requests.reject(id, request.admin.id, dto.feedback);
  }
}
