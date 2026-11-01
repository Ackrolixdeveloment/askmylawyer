import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminConsultationsService, type Bucket } from './admin-consultations.service';
import { ConsultationPeopleDto, ListConsultationsDto } from './dto/consultation.dto';

const BUCKETS: Bucket[] = ['all', 'scheduled', 'reports', 'completed', 'in-progress', 'cancelled', 'refunded'];

@Controller('admin/consultations')
@UseGuards(AdminAuthGuard)
export class AdminConsultationsController {
  constructor(private readonly consultations: AdminConsultationsService) {}

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

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.detail(id);
  }
}
