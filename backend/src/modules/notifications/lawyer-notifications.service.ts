import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../infrastructure/mail/mail.service';

interface Recipient {
  name: string;
  email: string | null;
}

/** Wraps the body in the same plain, readable shell for every message. */
function layout(heading: string, body: string) {
  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1f2937;line-height:1.6">
  <h2 style="margin:0 0 12px;font-size:20px;color:#111827">${heading}</h2>
  ${body}
  <p style="margin:24px 0 0;font-size:12px;color:#6b7280">Ask My Lawyer</p>
</div>`;
}

const listNotes = (notes: Record<string, string>) =>
  Object.entries(notes)
    .map(([section, note]) => `<li><strong>${section}:</strong> ${note}</li>`)
    .join('');

const plainNotes = (notes: Record<string, string>) =>
  Object.entries(notes)
    .map(([section, note]) => `- ${section}: ${note}`)
    .join('\n');

/**
 * Tells a lawyer what an admin decided about their application.
 *
 * Email only for now; SMS and push land here too once MSG91 and FCM are set
 * up, so every channel fires from the same place.
 */
@Injectable()
export class LawyerNotificationsService {
  private readonly logger = new Logger(LawyerNotificationsService.name);

  constructor(private readonly mail: MailService) {}

  approved(to: Recipient) {
    return this.send(to, {
      subject: 'Your Ask My Lawyer account is approved',
      text: `Hi ${to.name},\n\nYour application has been approved. Open the Ask My Lawyer app to sign in and start taking consultations.\n\nAsk My Lawyer`,
      html: layout(
        'Your account is approved',
        `<p>Hi ${to.name},</p>
         <p>Your application has been approved. Open the <strong>Ask My Lawyer</strong> app to sign in and start taking consultations.</p>`,
      ),
    });
  }

  correctionRequested(to: Recipient, notes: Record<string, string>) {
    return this.send(to, {
      subject: 'Action needed on your Ask My Lawyer application',
      text: `Hi ${to.name},\n\nOur team reviewed your application and needs a few things corrected:\n\n${plainNotes(notes)}\n\nOpen the Ask My Lawyer app to update these details and submit again.\n\nAsk My Lawyer`,
      html: layout(
        'A few details need correcting',
        `<p>Hi ${to.name},</p>
         <p>Our team reviewed your application and needs the following corrected:</p>
         <ul>${listNotes(notes)}</ul>
         <p>Open the <strong>Ask My Lawyer</strong> app to update these details and submit again.</p>`,
      ),
    });
  }

  rejected(to: Recipient, reason: string) {
    return this.send(to, {
      subject: 'Update on your Ask My Lawyer application',
      text: `Hi ${to.name},\n\nWe could not approve your application at this time.\n\nReason: ${reason}\n\nIf you believe this is a mistake, please contact our support team.\n\nAsk My Lawyer`,
      html: layout(
        'Your application was not approved',
        `<p>Hi ${to.name},</p>
         <p>We could not approve your application at this time.</p>
         <p style="padding:12px 14px;background:#fef2f2;border-left:3px solid #ef4444"><strong>Reason:</strong> ${reason}</p>
         <p>If you believe this is a mistake, please contact our support team.</p>`,
      ),
    });
  }

  /** A failed email must never fail the admin's decision. */
  private async send(
    to: Recipient,
    message: { subject: string; text: string; html: string },
  ) {
    if (!to.email) {
      this.logger.warn(`No email on file for ${to.name} — nothing sent.`);
      return;
    }

    try {
      await this.mail.send({ to: to.email, ...message });
    } catch (error) {
      this.logger.error(`Could not email ${to.email}: ${(error as Error).message}`);
    }
  }
}
