import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { AppRole, OtpChannel } from '@prisma/client';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { AppException } from '../../common/app-exception';
import { env } from '../../config/env';
import { MailService } from '../../infrastructure/mail/mail.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const MAX_VERIFY_ATTEMPTS = 5;

const hashCode = (channel: OtpChannel, target: string, role: AppRole, code: string) =>
  createHmac('sha256', env.JWT_ACCESS_SECRET)
    .update(`${channel}:${role}:${target}:${code}`)
    .digest('hex');

const expired = () =>
  new AppException(
    HttpStatus.BAD_REQUEST,
    'OTP_EXPIRED',
    'This code has expired. Please request a new one.',
  );

/** Login codes for the lawyer and customer apps, by SMS or email. */
@Injectable()
export class OtpService implements OnModuleInit {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  onModuleInit() {
    if (env.OTP_BYPASS_ENABLED) {
      this.logger.warn('OTP bypass is ON — no SMS/email is sent and the bypass code is accepted.');
    }
  }

  async send(channel: OtpChannel, target: string, role: AppRole) {
    const now = Date.now();
    const recent = await this.prisma.otpCode.findMany({
      where: { channel, target, role, createdAt: { gte: new Date(now - 3_600_000) } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const cooldownMs = env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
    if (recent[0] && now - recent[0].createdAt.getTime() < cooldownMs) {
      const wait = Math.ceil((cooldownMs - (now - recent[0].createdAt.getTime())) / 1000);
      throw new AppException(
        HttpStatus.TOO_MANY_REQUESTS,
        'OTP_COOLDOWN',
        `Please wait ${wait} seconds before requesting a new code.`,
      );
    }
    if (recent.length >= env.OTP_MAX_SENDS_PER_HOUR) {
      throw new AppException(
        HttpStatus.TOO_MANY_REQUESTS,
        'OTP_LIMIT_REACHED',
        'Too many codes requested. Please try again in an hour.',
      );
    }

    const code = env.OTP_BYPASS_ENABLED
      ? env.OTP_BYPASS_CODE
      : randomInt(0, 1_000_000).toString().padStart(6, '0');

    await this.prisma.$transaction([
      // Only the newest code is valid.
      this.prisma.otpCode.updateMany({
        where: { channel, target, role, consumedAt: null },
        data: { consumedAt: new Date() },
      }),
      this.prisma.otpCode.create({
        data: {
          channel,
          target,
          role,
          codeHash: hashCode(channel, target, role, code),
          expiresAt: new Date(now + env.OTP_TTL_MINUTES * 60_000),
        },
      }),
    ]);

    if (!env.OTP_BYPASS_ENABLED) {
      if (channel === 'sms') await this.sendSms(target, code);
      else await this.sendEmail(target, code);
    }

    return {
      expiresInSeconds: env.OTP_TTL_MINUTES * 60,
      resendAfterSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
    };
  }

  /** Throws unless the code matches the newest unexpired OTP; consumes it on success. */
  async verify(channel: OtpChannel, target: string, role: AppRole, code: string) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { channel, target, role, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw expired();
    if (otp.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new AppException(
        HttpStatus.TOO_MANY_REQUESTS,
        'OTP_TOO_MANY_ATTEMPTS',
        'Too many wrong attempts. Please request a new code.',
      );
    }

    const expected = Buffer.from(otp.codeHash, 'hex');
    const actual = Buffer.from(hashCode(channel, target, role, code), 'hex');
    if (!timingSafeEqual(expected, actual)) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new AppException(HttpStatus.BAD_REQUEST, 'OTP_INVALID', 'That code is not correct.');
    }

    // Guarded update so the same code can't be used twice in parallel.
    const { count } = await this.prisma.otpCode.updateMany({
      where: { id: otp.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (count === 0) throw expired();
  }

  /** MSG91 goes here once the DLT template is approved. */
  private async sendSms(phone: string, code: string) {
    if (env.NODE_ENV === 'production') {
      this.logger.error(`SMS provider not configured — OTP for ${phone.slice(0, -4)}XXXX not sent.`);
      throw new AppException(
        HttpStatus.SERVICE_UNAVAILABLE,
        'SMS_UNAVAILABLE',
        'We could not send the code right now. Please try again later.',
      );
    }
    this.logger.log(`[DEV SMS] OTP for ${phone}: ${code}`);
  }

  private sendEmail(email: string, code: string) {
    return this.mail.send({
      to: email,
      subject: `${code} is your Ask My Lawyer verification code`,
      text: `Your Ask My Lawyer verification code is ${code}. It expires in ${env.OTP_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.`,
      html: `<p>Your Ask My Lawyer verification code is</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>It expires in ${env.OTP_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.</p>`,
    });
  }
}
