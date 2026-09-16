import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AppException } from '../../common/app-exception';
import { LawyerAuthService, type LawyerPayload } from './lawyer-auth.service';

type LawyerUser = NonNullable<Awaited<ReturnType<LawyerAuthService['validateAccess']>>>;

export interface LawyerRequest extends Request {
  lawyer: LawyerUser;
}

const unauthorized = () =>
  new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Please sign in.');

/** Mobile apps send `Authorization: Bearer <accessToken>`. */
@Injectable()
export class LawyerAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly auth: LawyerAuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<LawyerRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw unauthorized();

    let payload: LawyerPayload;
    try {
      payload = await this.jwt.verifyAsync<LawyerPayload>(header.slice(7));
    } catch {
      throw unauthorized();
    }
    if (payload.typ !== 'lawyer') throw unauthorized();

    const lawyer = await this.auth.validateAccess(payload);
    if (!lawyer) throw unauthorized();

    request.lawyer = lawyer;
    return true;
  }
}
