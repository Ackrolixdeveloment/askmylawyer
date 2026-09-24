import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RtcRole, RtcTokenBuilder } from 'agora-token';
import { AppException } from '../../common/app-exception';
import { env } from '../../config/env';

export interface CallCredentials {
  appId: string;
  channel: string;
  /** Who the token is for; both sides need different numbers. */
  uid: number;
  token: string;
  expiresAt: Date;
}

/**
 * Tokens for Agora voice and video calls.
 *
 * The App Certificate never leaves the server: each participant gets a token
 * scoped to one channel, one uid and a short life, so a leaked token is worth
 * nothing once the consultation is over.
 */
@Injectable()
export class AgoraService {
  private readonly logger = new Logger(AgoraService.name);

  get configured() {
    return Boolean(env.AGORA_APP_ID && env.AGORA_APP_CERTIFICATE);
  }

  /**
   * A token for one participant. [uid] must differ between the two people in
   * a call — we use 1 for the customer and 2 for the lawyer.
   */
  issue(channel: string, uid: number, validForSeconds: number): CallCredentials {
    if (!this.configured) {
      this.logger.error('AGORA_APP_ID / AGORA_APP_CERTIFICATE are not set.');
      throw new AppException(
        HttpStatus.SERVICE_UNAVAILABLE,
        'CALLS_UNAVAILABLE',
        'Calling is not set up yet.',
      );
    }

    const expiresAt = new Date(Date.now() + validForSeconds * 1000);
    const expiry = Math.floor(expiresAt.getTime() / 1000);

    const token = RtcTokenBuilder.buildTokenWithUid(
      env.AGORA_APP_ID!,
      env.AGORA_APP_CERTIFICATE!,
      channel,
      uid,
      // Both sides speak and are heard; nobody is an audience member.
      RtcRole.PUBLISHER,
      expiry,
      expiry,
    );

    return { appId: env.AGORA_APP_ID!, channel, uid, token, expiresAt };
  }
}
