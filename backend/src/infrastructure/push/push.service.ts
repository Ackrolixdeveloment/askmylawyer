import { Injectable, Logger } from '@nestjs/common';
import { importPKCS8, SignJWT } from 'jose';
import { env } from '../../config/env';

export interface PushMessage {
  title: string;
  body: string;
  /** Extra values the app reads on tap, e.g. a route to open. */
  data?: Record<string, string>;
}

export interface PushResult {
  delivered: number;
  failed: number;
  /** Tokens FCM no longer recognises — the caller should delete them. */
  staleTokens: string[];
  /** True when no credentials are set and the push was only logged. */
  simulated: boolean;
}

/**
 * Accepts the service-account key however it was pasted: the full PEM from
 * the JSON, or just the base64 body with the header and line breaks lost on
 * the way into the env file.
 */
function toPem(key: string) {
  const trimmed = key.trim();
  if (trimmed.includes('BEGIN')) return trimmed;

  const body = trimmed.replace(/\s+/g, '').match(/.{1,64}/g)?.join('\n') ?? '';
  return `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`;
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

/** How many sends are in flight at once. FCM v1 takes one token per call. */
const BATCH = 20;

/**
 * Sends through Firebase Cloud Messaging (HTTP v1). Without a service account
 * — local development — messages are logged instead, so the flow can still be
 * exercised end to end.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  /** Google's access token, reused until shortly before it expires. */
  private accessToken: { value: string; expiresAt: number } | null = null;

  get configured() {
    return Boolean(
      env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY,
    );
  }

  async send(tokens: string[], message: PushMessage): Promise<PushResult> {
    if (tokens.length === 0) {
      return { delivered: 0, failed: 0, staleTokens: [], simulated: !this.configured };
    }

    if (!this.configured) {
      this.logger.warn(
        `[DEV PUSH] ${tokens.length} device(s) — ${message.title}: ${message.body}`,
      );
      return { delivered: 0, failed: 0, staleTokens: [], simulated: true };
    }

    let delivered = 0;
    let failed = 0;
    const staleTokens: string[] = [];

    for (let index = 0; index < tokens.length; index += BATCH) {
      const slice = tokens.slice(index, index + BATCH);
      const results = await Promise.all(
        slice.map((token) => this.sendOne(token, message)),
      );

      for (const [position, result] of results.entries()) {
        if (result === 'ok') delivered += 1;
        else {
          failed += 1;
          if (result === 'stale') staleTokens.push(slice[position]);
        }
      }
    }

    this.logger.log(
      `Push "${message.title}" — ${delivered} delivered, ${failed} failed, ${staleTokens.length} stale`,
    );
    return { delivered, failed, staleTokens, simulated: false };
  }

  private async sendOne(token: string, message: PushMessage): Promise<'ok' | 'stale' | 'failed'> {
    try {
      const accessToken = await this.authorise();
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title: message.title, body: message.body },
              data: message.data,
              android: { priority: 'HIGH', notification: { channel_id: 'ask_my_lawyer_alerts' } },
              apns: {
                headers: { 'apns-priority': '10' },
                payload: { aps: { sound: 'default' } },
              },
            },
          }),
        },
      );

      if (response.ok) return 'ok';

      const detail = await response.text();
      // The app was uninstalled or the token was replaced.
      if (response.status === 404 || detail.includes('UNREGISTERED')) return 'stale';

      this.logger.warn(`FCM rejected a token: ${response.status} ${detail}`);
      return 'failed';
    } catch (error) {
      this.logger.error({ err: error }, 'FCM request failed');
      return 'failed';
    }
  }

  /** Swaps the service-account key for an OAuth token, cached until it expires. */
  private async authorise() {
    if (this.accessToken && this.accessToken.expiresAt > Date.now()) {
      return this.accessToken.value;
    }

    const key = await importPKCS8(toPem(env.FIREBASE_PRIVATE_KEY!), 'RS256');
    const assertion = await new SignJWT({ scope: SCOPE })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(env.FIREBASE_CLIENT_EMAIL!)
      .setAudience(TOKEN_URL)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(key);

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });

    if (!response.ok) {
      throw new Error(`Google refused the service account: ${await response.text()}`);
    }

    const { access_token, expires_in } = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    // A minute of slack, so a token never expires mid-batch.
    this.accessToken = {
      value: access_token,
      expiresAt: Date.now() + (expires_in - 60) * 1000,
    };
    return access_token;
  }
}
