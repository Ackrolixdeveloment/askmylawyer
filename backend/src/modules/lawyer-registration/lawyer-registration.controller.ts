import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  Post,
  Put,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { LawyerDocumentType } from '@prisma/client';
import type { Response } from 'express';
import { LawyerAuthGuard, type LawyerRequest } from '../lawyer-auth/lawyer-auth.guard';
import { BankDto, KycDto, PersonalDto, ProfessionalDto, ProfileDto } from './dto/registration.dto';
import { LawyerRegistrationService } from './lawyer-registration.service';

type Files = Record<string, Express.Multer.File[]>;

/** Largest file any step accepts; per-field limits are checked in the service. */
const uploadLimits = (files: number) => ({ limits: { fileSize: 5 * 1024 * 1024, files } });

@Controller('lawyer/registration')
@UseGuards(LawyerAuthGuard)
export class LawyerRegistrationController {
  constructor(private readonly registration: LawyerRegistrationService) {}

  @Get()
  get(@Req() request: LawyerRequest) {
    return this.registration.get(request.lawyer.id);
  }

  /** Step 1 — JSON: { fullName, email, mobile? } */
  @Put('personal')
  savePersonal(@Req() request: LawyerRequest, @Body() dto: PersonalDto) {
    return this.registration.savePersonal(request.lawyer.id, dto);
  }

  /** Step 2 — multipart: aadhaarNumber, panNumber, residentialAddress?, aadhaarFile, panFile */
  @Put('kyc')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'aadhaarFile', maxCount: 1 },
        { name: 'panFile', maxCount: 1 },
      ],
      uploadLimits(2),
    ),
  )
  saveKyc(@Req() request: LawyerRequest, @Body() dto: KycDto, @UploadedFiles() files: Files = {}) {
    return this.registration.saveKyc(request.lawyer.id, dto, files);
  }

  /** Step 3 — multipart: qualification, barCouncilState, enrollmentNumber, certificate */
  @Put('professional')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'certificate', maxCount: 1 }], uploadLimits(1)))
  saveProfessional(
    @Req() request: LawyerRequest,
    @Body() dto: ProfessionalDto,
    @UploadedFiles() files: Files = {},
  ) {
    return this.registration.saveProfessional(request.lawyer.id, dto, files);
  }

  /** Step 4 — multipart: accountHolderName, accountNumber, confirmAccountNumber, ifscCode, bankName, swiftCode?, proof */
  @Put('bank')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'proof', maxCount: 1 }], uploadLimits(1)))
  saveBank(@Req() request: LawyerRequest, @Body() dto: BankDto, @UploadedFiles() files: Files = {}) {
    return this.registration.saveBank(request.lawyer.id, dto, files);
  }

  /** Professional profile — multipart: about, experience, languages, caseCategories, specialisations, photo?, signature? */
  @Put('profile')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'photo', maxCount: 1 },
        { name: 'signature', maxCount: 1 },
      ],
      uploadLimits(2),
    ),
  )
  saveProfile(@Req() request: LawyerRequest, @Body() dto: ProfileDto, @UploadedFiles() files: Files = {}) {
    return this.registration.saveProfile(request.lawyer.id, dto, files);
  }

  @Post('submit')
  @HttpCode(200)
  submit(@Req() request: LawyerRequest) {
    return this.registration.submit(request.lawyer.id);
  }

  /** Streams one of the lawyer's own uploads. */
  @Get('documents/:type')
  async document(
    @Req() request: LawyerRequest,
    @Param('type', new ParseEnumPipe(LawyerDocumentType)) type: LawyerDocumentType,
    @Res() response: Response,
  ) {
    const { document, body } = await this.registration.getDocument(request.lawyer.id, type);
    response
      .setHeader('Content-Type', document.mimeType)
      .setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalName)}"`)
      .setHeader('Cache-Control', 'private, no-store')
      .send(body);
  }
}
