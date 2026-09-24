import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { LawyerAuthGuard, type LawyerRequest } from '../lawyer-auth/lawyer-auth.guard';
import { ConsultationsService } from './consultations.service';
import { DispatchService } from './dispatch.service';
import { HeartbeatDto } from './dto/consultation.dto';
import { PresenceService } from './presence.service';

/** The lawyer app: being available, answering offers, joining the call. */
@Controller('lawyer')
@UseGuards(LawyerAuthGuard)
export class LawyerConsultationsController {
  constructor(
    private readonly consultations: ConsultationsService,
    private readonly dispatch: DispatchService,
    private readonly presence: PresenceService,
  ) {}

  // ---- Being available ----

  @Get('presence')
  presenceStatus(@Req() request: LawyerRequest) {
    return this.presence.status(request.lawyer.id);
  }

  /** Sent on the timer while online, and whenever the toggle moves. */
  @Post('presence/heartbeat')
  @HttpCode(200)
  heartbeat(@Req() request: LawyerRequest, @Body() dto: HeartbeatDto) {
    return this.presence.heartbeat(request.lawyer.id, dto);
  }

  @Post('presence/offline')
  @HttpCode(200)
  goOffline(@Req() request: LawyerRequest) {
    return this.presence.goOffline(request.lawyer.id);
  }

  // ---- Offers ----

  /** Anything still ringing, for when the app is reopened. */
  @Get('offers')
  pendingOffers(@Req() request: LawyerRequest) {
    return this.consultations.pendingOffers(request.lawyer.id);
  }

  @Get('offers/:id')
  offer(@Req() request: LawyerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.offerForLawyer(request.lawyer.id, id);
  }

  @Post('offers/:id/accept')
  @HttpCode(200)
  accept(@Req() request: LawyerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.dispatch.accept(request.lawyer.id, id);
  }

  @Post('offers/:id/decline')
  @HttpCode(200)
  decline(@Req() request: LawyerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.dispatch.decline(request.lawyer.id, id);
  }

  // ---- Consultations ----

  @Get('consultations')
  list(@Req() request: LawyerRequest) {
    return this.consultations.listForLawyer(request.lawyer.id);
  }

  @Get('consultations/:id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.detail(id);
  }

  @Post('consultations/:id/call-token')
  @HttpCode(200)
  callToken(@Req() request: LawyerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.callCredentials(request.lawyer.id, id);
  }

  @Post('consultations/:id/end')
  @HttpCode(200)
  end(@Req() request: LawyerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.endSession(request.lawyer.id, id);
  }
}
