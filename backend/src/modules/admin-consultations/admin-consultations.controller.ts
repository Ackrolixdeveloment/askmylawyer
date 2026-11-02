import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards, StreamableFile, Res } from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminConsultationsService, type Bucket } from './admin-consultations.service';
import { ConsultationPeopleDto, ListConsultationsDto } from './dto/consultation.dto';

const BUCKETS: Bucket[] = ['all', 'scheduled', 'reports', 'completed', 'in-progress', 'cancelled', 'refunded'];

@Controller('admin/consultations')
@UseGuards(AdminAuthGuard)
export class AdminConsultationsController {
  constructor(private readonly consultations: AdminConsultationsService, private readonly storage: StorageService) {}

  @Get('people')
  people(@Query() dto: ConsultationPeopleDto) { return this.consultations.people(dto.role, dto.q); }

  @Get('metrics')
  metrics() {
    return this.consultations.metrics();
  }

  /** One of the sidebar tabs: completed, in-progress, cancelled, refunded. */
  @Get('bucket/:bucket')
  list(@Param('bucket') bucket: string, @Query() dto: ListConsultationsDto) {
    const chosen = BUCKETS.includes(bucket as Bucket) ? (bucket as Bucket) : 'completed';
    return this.consultations.list(chosen, dto);
  }

  @Get(':id/report/attachments/:fileId')
  async attachment(@Param('id', ParseUUIDPipe) id: string, @Param('fileId', ParseUUIDPipe) fileId: string, @Res({passthrough:true}) response: Response) {
    const file=await this.consultations.attachment(id,fileId);
    const body=await this.storage.get(file.key);
    response.setHeader('Content-Type','application/octet-stream');
    response.setHeader('Cache-Control','private, no-store');
    response.setHeader('X-Content-Type-Options','nosniff');
    response.setHeader('Content-Disposition',`attachment; filename="report-attachment"; filename*=UTF-8''${encodeURIComponent(file.name).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16))}`);
    return new StreamableFile(body);
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.detail(id);
  }
}
