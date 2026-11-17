import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/app-exception';
import { decryptField, encryptField } from '../../common/field-encryption';
import { PrismaService } from '../prisma/prisma.service';
import { env } from '../../config/env';
import { SaveSmsSettingsDto } from '../../modules/admin-settings/dto/sms.dto';

@Injectable()
export class SmsSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const row = await this.prisma.smsSettings.findUnique({ where: { id: 1 } });
    return {
      provider: 'msg91' as const,
      source: row ? 'admin' : 'environment',
      accountLabel: row?.accountLabel ?? '',
      authKeyMasked: mask(row ? row.authKeyLast4 : env.MSG91_AUTH_KEY?.slice(-4)),
      configured: Boolean(row ? row.authKeyEnc : env.MSG91_AUTH_KEY),
      senderId: row?.senderId ?? env.MSG91_SENDER_ID,
      countryCode: row?.countryCode ?? env.MSG91_COUNTRY_CODE,
      dltTemplateId: row?.dltTemplateId ?? env.MSG91_DLT_TE_ID ?? '',
      message: row?.message ?? env.MSG91_OTP_MESSAGE,
      otpBypassEnabled: env.OTP_BYPASS_ENABLED,
      updatedAt: row?.updatedAt ?? null,
    };
  }

  async save(dto: SaveSmsSettingsDto, actorId: string) {
    if (dto.message.split('{otp}').length !== 2) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'SMS_TEMPLATE_INVALID', 'Include {otp} exactly once in the approved message.');
    }
    const existing = await this.prisma.smsSettings.findUnique({ where: { id: 1 } });
    if (!dto.authKey && !existing?.authKeyEnc) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'SMS_AUTH_KEY_REQUIRED', 'Enter the MSG91 Auth Key to activate admin-managed settings.');
    }
    const data = {
      accountLabel: dto.accountLabel,
      senderId: dto.senderId,
      countryCode: dto.countryCode,
      dltTemplateId: dto.dltTemplateId,
      message: dto.message,
      updatedById: actorId,
      ...(dto.authKey ? { authKeyEnc: encryptField(dto.authKey), authKeyLast4: dto.authKey.slice(-4) } : {}),
    };
    await this.prisma.smsSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
    return this.get();
  }

  /** Read on every send so account/template changes need no application restart. */
  async active() {
    const row = await this.prisma.smsSettings.findUnique({ where: { id: 1 } });
    return row ? {
      authKey: row.authKeyEnc ? decryptField(row.authKeyEnc) : undefined,
      senderId: row.senderId, countryCode: row.countryCode,
      dltTemplateId: row.dltTemplateId, message: row.message,
    } : {
      authKey: env.MSG91_AUTH_KEY, senderId: env.MSG91_SENDER_ID,
      countryCode: env.MSG91_COUNTRY_CODE, dltTemplateId: env.MSG91_DLT_TE_ID,
      message: env.MSG91_OTP_MESSAGE,
    };
  }
}

const mask = (tail: string | null | undefined) => tail ? `••••••${tail}` : '';
