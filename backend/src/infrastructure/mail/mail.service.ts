import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppException } from '../../common/app-exception';
import { env } from '../../config/env';

interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Sends email through Resend; without an API key (local dev) it logs instead. */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /** "Ask My Lawyer <noreply@example.com>" — what recipients see. */
  private readonly from = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;

  async send(message: MailMessage) {
    if (!env.RESEND_API_KEY) {
      if (env.NODE_ENV === 'production') {
        this.logger.error('RESEND_API_KEY is not set — email not sent.');
        throw unavailable();
      }
      this.logger.log(`[DEV EMAIL] to ${message.to} — ${message.subject}\n${message.text}`);
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, ...message }),
    }).catch((error: unknown) => {
      this.logger.error({ err: error }, 'Resend request failed');
      throw unavailable();
    });

    if (!response.ok) {
      this.logger.error(`Resend rejected email: ${response.status} ${await response.text()}`);
      throw unavailable();
    }

    // The id makes a delivery traceable in the Resend dashboard / CloudWatch.
    const { id } = (await response.json().catch(() => ({}))) as { id?: string };
    this.logger.log(`Emailed ${message.to} — ${message.subject} (${id ?? 'sent'})`);
  }
}

const unavailable = () =>
  new AppException(
    HttpStatus.SERVICE_UNAVAILABLE,
    'EMAIL_UNAVAILABLE',
    'We could not send the email right now. Please try again later.',
  );
