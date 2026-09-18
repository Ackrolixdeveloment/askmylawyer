import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Put } from '@nestjs/common';
import { LawyerAuthGuard, type LawyerRequest } from '../lawyer-auth/lawyer-auth.guard';
import { UpdateBankDto, UpdateProfileDto } from './dto/update-profile.dto';
import { LawyerProfileService } from './lawyer-profile.service';

@Controller('lawyer/profile')
@UseGuards(LawyerAuthGuard)
export class LawyerProfileController {
  constructor(private readonly profile: LawyerProfileService) {}

  /** The lawyer's own account details, for the settings and profile screens. */
  @Get()
  get(@Req() request: LawyerRequest) {
    return this.profile.get(request.lawyer.id);
  }

  /** Saves one or more sections of the profile. */
  @Patch()
  update(@Req() request: LawyerRequest, @Body() dto: UpdateProfileDto) {
    return this.profile.update(request.lawyer.id, dto);
  }

  /** Asks for the payout account to be changed; an admin has to approve it. */
  @Put('bank')
  @UseInterceptors(FileInterceptor('proof', { limits: { fileSize: 5 * 1024 * 1024 } }))
  updateBank(
    @Req() request: LawyerRequest,
    @Body() dto: UpdateBankDto,
    @UploadedFile() proof?: Express.Multer.File,
  ) {
    return this.profile.requestBankChange(request.lawyer.id, dto, proof);
  }

  /** Replaces the profile photo. */
  @Post('photo')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 5 * 1024 * 1024 } }))
  savePhoto(@Req() request: LawyerRequest, @UploadedFile() photo: Express.Multer.File) {
    return this.profile.savePhoto(request.lawyer.id, photo);
  }
}
