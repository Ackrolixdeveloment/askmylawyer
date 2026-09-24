import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AppException } from '../../common/app-exception';
import { AdminAuthService, type AccessPayload, type AdminProfile } from './admin-auth.service';
import { ACCESS_COOKIE } from './cookies';
import { requirementFor, satisfies } from './route-permissions';

export interface AdminRequest extends Request {
  admin: AdminProfile;
}

const unauthorized = () =>
  new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Please sign in.');

const forbidden = () =>
  new AppException(
    HttpStatus.FORBIDDEN,
    'NO_ACCESS',
    'You do not have access to this part of the panel.',
  );

/** Accepts the access token from the httpOnly cookie, or a Bearer header for API tools. */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly auth: AdminAuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const header = request.headers.authorization;
    const token =
      request.cookies?.[ACCESS_COOKIE] ??
      (header?.startsWith('Bearer ') ? header.slice(7) : undefined);

    if (!token) throw unauthorized();

    let payload: AccessPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessPayload>(token);
    } catch {
      throw unauthorized();
    }
    if (payload.typ !== 'admin') throw unauthorized();

    const admin = await this.auth.validateAccess(payload);
    if (!admin) throw unauthorized();

    request.admin = admin;

    // The Super Admin runs the panel; everyone else is held to their matrix.
    if (admin.role.isSystem) return true;

    const requirement = requirementFor(request.method, request.originalUrl ?? request.url);
    if (requirement && !satisfies(admin.permissions, requirement)) throw forbidden();

    return true;
  }
}
