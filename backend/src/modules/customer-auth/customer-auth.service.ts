import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { AppException } from '../../common/app-exception';
import { env } from '../../config/env';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { OtpService } from '../otp/otp.service';

const customerSelect = {
  id: true,
  phone: true,
  email: true,
  fullName: true,
  status: true,
  deletedAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type CustomerRow = Prisma.UserGetPayload<{ select: typeof customerSelect }>;

export interface CustomerPayload {
  sub: string;
  sid: string;
  typ: 'customer';
}

interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const toE164 = (mobile: string) => `+91${mobile}`;

const sessionExpired = () =>
  new AppException(HttpStatus.UNAUTHORIZED, 'SESSION_EXPIRED', 'Please sign in again.');

const suspended = () =>
  new AppException(
    HttpStatus.FORBIDDEN,
    'ACCOUNT_SUSPENDED',
    'Your account has been suspended. Please contact support.',
  );

/** What the customer app receives about the signed-in customer. */
export function toCustomerResponse(user: CustomerRow) {
  return {
    id: user.id,
    mobile: user.phone,
    email: user.email,
    fullName: user.fullName,
    status: user.status,
    createdAt: user.createdAt,
  };
}

/** Mobile OTP sign-in for the customer app. */
@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly otp: OtpService,
  ) {}

  sendMobileOtp(mobile: string) {
    return this.otp.send('sms', toE164(mobile), 'customer');
  }

  async verifyMobileOtp(mobile: string, code: string, client: ClientInfo) {
    const phone = toE164(mobile);
    await this.otp.verify('sms', phone, 'customer', code);

    let user = await this.prisma.user.findUnique({
      where: { phone_role: { phone, role: 'customer' } },
      select: customerSelect,
    });
    const isNewUser = !user;

    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, role: 'customer' },
        select: customerSelect,
      });
    }

    return this.signIn(user, isNewUser, client);
  }

  /** Swaps a refresh token for a new pair; a reused one ends every session. */
  async refresh(refreshToken: string, client: ClientInfo) {
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: sha256(refreshToken) },
      include: { user: { select: { role: true, status: true, deletedAt: true } } },
    });

    if (!session || session.user.role !== 'customer') throw sessionExpired();
    if (session.user.status === 'suspended') throw suspended();

    if (session.revokedAt) {
      await this.prisma.userSession.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw sessionExpired();
    }

    if (session.expiresAt <= new Date() || session.user.deletedAt) throw sessionExpired();

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.startSession(session.userId, client);
  }

  async logout(refreshToken: string) {
    await this.prisma.userSession.updateMany({
      where: { refreshTokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Used by the guard on every customer request. */
  async validateAccess(payload: CustomerPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, role: 'customer', deletedAt: null },
      select: customerSelect,
    });
    if (!user) return null;
    if (user.status === 'suspended') throw suspended();

    const session = await this.prisma.userSession.findUnique({
      where: { id: payload.sid },
      select: { userId: true, revokedAt: true, expiresAt: true },
    });
    if (!session || session.userId !== payload.sub || session.revokedAt) return null;
    if (session.expiresAt <= new Date()) return null;

    return user;
  }

  /** Lets the customer put a name to their account after signing in. */
  async updateProfile(userId: string, fullName?: string, email?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(email !== undefined ? { email: email.toLowerCase() } : {}),
      },
      select: customerSelect,
    });

    return toCustomerResponse(user);
  }

  private async signIn(user: CustomerRow, isNewUser: boolean, client: ClientInfo) {
    if (user.deletedAt) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'ACCOUNT_DELETED',
        'This account was deleted. Please contact support.',
      );
    }
    if (user.status === 'suspended') throw suspended();

    const customer = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: customerSelect,
    });

    const tokens = await this.startSession(customer.id, client);
    return { ...tokens, isNewUser, customer: toCustomerResponse(customer) };
  }

  private async startSession(userId: string, client: ClientInfo) {
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshTokenExpiresAt = new Date(
      Date.now() + env.APP_REFRESH_TOKEN_TTL_DAYS * 86_400_000,
    );
    const accessTokenExpiresAt = new Date(Date.now() + env.ACCESS_TOKEN_TTL_MINUTES * 60_000);

    const session = await this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash: sha256(refreshToken),
        expiresAt: refreshTokenExpiresAt,
        ip: client.ip,
        userAgent: client.userAgent?.slice(0, 500),
      },
    });

    const payload: CustomerPayload = { sub: userId, sid: session.id, typ: 'customer' };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: env.ACCESS_TOKEN_TTL_MINUTES * 60,
    });

    return { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt };
  }
}
