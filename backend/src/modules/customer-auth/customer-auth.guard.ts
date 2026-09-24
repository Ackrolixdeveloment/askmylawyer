import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AppException } from '../../common/app-exception';
import { CustomerAuthService, type CustomerPayload } from './customer-auth.service';

type Customer = NonNullable<Awaited<ReturnType<CustomerAuthService['validateAccess']>>>;

export interface CustomerRequest extends Request {
  customer: Customer;
}

const unauthorized = () =>
  new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Please sign in.');

/** The customer app sends `Authorization: Bearer <accessToken>`. */
@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly auth: CustomerAuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<CustomerRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw unauthorized();

    let payload: CustomerPayload;
    try {
      payload = await this.jwt.verifyAsync<CustomerPayload>(header.slice(7));
    } catch {
      throw unauthorized();
    }
    if (payload.typ !== 'customer') throw unauthorized();

    const customer = await this.auth.validateAccess(payload);
    if (!customer) throw unauthorized();

    request.customer = customer;
    return true;
  }
}
