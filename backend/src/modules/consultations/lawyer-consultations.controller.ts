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
  UseGuards,
} from '@nestjs/common';
import { LawyerAuthGuard, type LawyerRequest } from '../lawyer-auth/lawyer-auth.guard';
import { ConsultationsService } from './consultations.service';
import { DispatchService } from './dispatch.service';
import { HeartbeatDto } from './dto/consultation.dto';
import { SendMessageDto } from './dto/message.dto';
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

  /** The call the lawyer can still join, for the home screen's card. */
  @Get('consultations/live')
  live(@Req() request: LawyerRequest) {
    return this.consultations.liveFor(request.lawyer.id);
  }

  @Get('consultations')
  list(@Req() request: LawyerRequest) {
    return this.consultations.listForLawyer(request.lawyer.id);
  }

  /** One consultation, as the history's detail screen shows it. */
  @Get('consultations/:id')
  detail(@Req() request: LawyerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.detailForLawyer(request.lawyer.id, id);
  }

  /** Asks the client for more minutes. Nothing moves until they agree. */
  @Post('consultations/:id/extend')
  @HttpCode(200)
  extend(@Req() request: LawyerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.requestExtension(request.lawyer.id, id);
  }

  /** The consultation's chat: what was typed rather than said. */
  @Get('consultations/:id/messages')
  messages(
    @Req() request: LawyerRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('after') after?: string,
  ) {
    return this.consultations.messages(request.lawyer.id, id, after);
  }

  @Post('consultations/:id/messages')
  @HttpCode(201)
  sendMessage(
    @Req() request: LawyerRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.consultations.sendMessage(request.lawyer.id, id, dto.body);
  }

  /** Sent every few seconds while in the call; says who else is there. */
  @Post('consultations/:id/ping')
  @HttpCode(200)
  ping(@Req() request: LawyerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.ping(request.lawyer.id, id);
  }

  @Post('consultations/:id/media/video')
  @HttpCode(200)
  recordVideo(@Req() request: LawyerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.recordVideo(request.lawyer.id, id);
  }

  @Get('consultations/:id/preparation')
  preparation(@Req() request: LawyerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultations.preparation(request.lawyer.id, id);
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
