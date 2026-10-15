import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppException } from '../../common/app-exception';
import { env } from '../../config/env';

/**
 * Sends SMS through MSG91's DLT transactional route.
 *
 * We generate and check the code ourselves; MSG91 only carries the message.
 * That is deliberate — MSG91's own OTP API ties the code's lifetime to their
 * template, and we already have expiry, resend cooldowns and attempt limits
 * in [OtpService].
 *
 * The message text must match the DLT-approved template **word for word**,
 * with the code as the only variable. India's DLT registry checks it on the
 * way through and silently drops anything that differs, so
 * `MSG91_OTP_MESSAGE` is configuration rather than something to reword here.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  get configured() {
    return Boolean(env.MSG91_AUTH_KEY);
  }

  /** Sends one message. Throws when it could not be delivered. */
  async sendOtp(phone: string, code: string) {
    if (!this.configured) {
      if (env.NODE_ENV === 'production') {
        this.logger.error(`MSG91_AUTH_KEY is not set — OTP for ${mask(phone)} not sent.`);
        throw unavailable();
      }
      this.logger.log(`[DEV SMS] OTP for ${phone}: ${code}`);
      return;
    }

    const params = new URLSearchParams({
      authkey: env.MSG91_AUTH_KEY!,
      mobiles: toMsg91(phone),
      message: env.MSG91_OTP_MESSAGE.replace('{otp}', code),
      sender: env.MSG91_SENDER_ID,
      // 4 is MSG91's transactional route, the only one DLT allows for OTPs.
      route: '4',
      country: env.MSG91_COUNTRY_CODE,
      ...(env.MSG91_DLT_TE_ID ? { DLT_TE_ID: env.MSG91_DLT_TE_ID } : {}),
    });

    let body: string;
    try {
      const response = await fetch(`${env.MSG91_SMS_URL}?${params.toString()}`, {
        signal: AbortSignal.timeout(10_000),
      });
      body = (await response.text()).trim();

      if (!response.ok) {
        this.logger.error(`MSG91 returned ${response.status}: ${body}`);
        throw unavailable();
      }
    } catch (error) {
      if (error instanceof AppException) throw error;
      this.logger.error({ err: error }, `Could not reach MSG91 for ${mask(phone)}`);
      throw unavailable();
    }

    // sendhttp answers 200 either way: a request id on success, or a message
    // saying what went wrong. The body is the only thing that tells them
    // apart.
    if (/error|invalid/i.test(body)) {
      this.logger.error(`MSG91 rejected the message for ${mask(phone)}: ${body}`);
      throw unavailable();
    }

    this.logger.log(`OTP sent to ${mask(phone)} (${body})`);
  }
}

/**
 * MSG91 wants digits with the country code and no plus.
 *
 * We store numbers in E.164, so this is mostly stripping the `+`. A bare
 * ten-digit number is assumed to be Indian, which is the only case where a
 * country code has to be guessed.
 */
export function toMsg91(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (phone.trim().startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.length === 10) return `${env.MSG91_COUNTRY_CODE}${digits}`;
  return digits;
}

/** Enough of the number to find it in a log, not enough to be personal. */
const mask = (phone: string) => `${phone.slice(0, -4)}XXXX`;

const unavailable = () =>
  new AppException(
    HttpStatus.SERVICE_UNAVAILABLE,
    'SMS_UNAVAILABLE',
    'We could not send the code right now. Please try again later.',
  );
