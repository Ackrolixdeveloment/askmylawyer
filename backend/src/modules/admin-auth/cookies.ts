import type { CookieOptions, Response } from 'express';
import { env } from '../../config/env';
import type { IssuedTokens } from './admin-auth.service';

export const ACCESS_COOKIE = 'aml_admin_access';
export const REFRESH_COOKIE = 'aml_admin_refresh';

/** The refresh cookie is only ever sent to the auth routes. */
const REFRESH_PATH = '/api/v1/admin/auth';

const base = (): CookieOptions => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  domain: env.COOKIE_DOMAIN,
});

export function setAuthCookies(response: Response, tokens: IssuedTokens) {
  response.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...base(),
    path: '/',
    expires: tokens.accessExpiresAt,
  });
  response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...base(),
    path: REFRESH_PATH,
    expires: tokens.refreshExpiresAt,
  });
}

export function clearAuthCookies(response: Response) {
  response.clearCookie(ACCESS_COOKIE, { ...base(), path: '/' });
  response.clearCookie(REFRESH_COOKIE, { ...base(), path: REFRESH_PATH });
}
