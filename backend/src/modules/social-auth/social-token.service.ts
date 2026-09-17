import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { createHash } from 'node:crypto';
import { AppException } from '../../common/app-exception';
import { env } from '../../config/env';

/** What we trust from a verified Google / Apple token. */
export interface SocialProfile {
  subject: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
}

// Keys are cached and rotated by jose.
const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

const invalidToken = () =>
  new AppException(
    HttpStatus.UNAUTHORIZED,
    'INVALID_SOCIAL_TOKEN',
    'Sign-in could not be verified. Please try again.',
  );

const notConfigured = (provider: string) =>
  new AppException(
    HttpStatus.SERVICE_UNAVAILABLE,
    `${provider.toUpperCase()}_LOGIN_UNAVAILABLE`,
    `${provider} sign-in is not available yet.`,
  );

const isTrue = (value: unknown) => value === true || value === 'true';

/** Verifies ID tokens issued to our apps by Google and Apple. */
@Injectable()
export class SocialTokenService {
  private readonly logger = new Logger(SocialTokenService.name);

  async verifyGoogle(idToken: string): Promise<SocialProfile> {
    if (env.GOOGLE_CLIENT_IDS.length === 0) throw notConfigured('Google');

    const payload = await this.verify(idToken, googleKeys, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: env.GOOGLE_CLIENT_IDS,
    });

    return {
      subject: payload.sub!,
      email: typeof payload.email === 'string' ? payload.email.toLowerCase() : null,
      emailVerified: isTrue(payload.email_verified),
      name: typeof payload.name === 'string' ? payload.name : null,
    };
  }

  /**
   * `rawNonce` is the nonce the app generated; Apple puts its SHA-256 in the
   * token, which stops a captured token being replayed.
   */
  async verifyApple(identityToken: string, rawNonce?: string): Promise<SocialProfile> {
    if (env.APPLE_CLIENT_IDS.length === 0) throw notConfigured('Apple');

    const payload = await this.verify(identityToken, appleKeys, {
      issuer: 'https://appleid.apple.com',
      audience: env.APPLE_CLIENT_IDS,
    });

    if (rawNonce !== undefined) {
      const expected = createHash('sha256').update(rawNonce).digest('hex');
      if (payload.nonce !== expected) throw invalidToken();
    }

    return {
      subject: payload.sub!,
      email: typeof payload.email === 'string' ? payload.email.toLowerCase() : null,
      emailVerified: isTrue(payload.email_verified),
      // Apple never puts the name in the token; the app sends it on first sign-in.
      name: null,
    };
  }

  private async verify(
    token: string,
    keys: ReturnType<typeof createRemoteJWKSet>,
    options: { issuer: string | string[]; audience: string[] },
  ): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, keys, options);
      if (!payload.sub) throw invalidToken();
      return payload;
    } catch (error) {
      if (error instanceof AppException) throw error;
      this.logger.warn(`Rejected social token: ${(error as Error).message}`);
      throw invalidToken();
    }
  }
}
