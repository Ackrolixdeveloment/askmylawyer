import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from '@node-rs/argon2';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { AppException } from '../../common/app-exception';
import { env } from '../../config/env';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

const adminSelect = {
  id: true,
  employeeCode: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  lastLoginAt: true,
  role: { select: { id: true, name: true, isSystem: true } },
} satisfies Prisma.AdminUserSelect;

export type AdminProfile = Prisma.AdminUserGetPayload<{ select: typeof adminSelect }>;

export interface AccessPayload {
  sub: string;
  sid: string;
  typ: 'admin';
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}

interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

const invalidCredentials = () =>
  new AppException(HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS', 'Incorrect email or password.');

const sessionExpired = () =>
  new AppException(HttpStatus.UNAUTHORIZED, 'SESSION_EXPIRED', 'Please sign in again.');

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AdminAuthService {
  /** Compared against when the email is unknown, so response time doesn't reveal which emails exist. */
  private readonly dummyHash = hash('not-a-real-password');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string, client: ClientInfo) {
    const admin = await this.prisma.adminUser.findFirst({
      where: { email, deletedAt: null },
      select: { ...adminSelect, passwordHash: true, failedLoginCount: true, lockedUntil: true },
    });

    if (!admin) {
      await verify(await this.dummyHash, password);
      throw invalidCredentials();
    }

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      throw new AppException(
        HttpStatus.LOCKED,
        'ACCOUNT_LOCKED',
        'Too many failed attempts. Try again in a few minutes.',
      );
    }

    if (!(await verify(admin.passwordHash, password))) {
      const failed = admin.failedLoginCount + 1;
      const lock = failed >= MAX_FAILED_LOGINS;
      await this.prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLoginCount: lock ? 0 : failed,
          lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
        },
      });
      throw invalidCredentials();
    }

    if (admin.status !== 'active') {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'ACCOUNT_INACTIVE',
        'Your account is inactive. Contact a Super Admin.',
      );
    }

    const lastLoginAt = new Date();
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt },
    });

    const tokens = await this.startSession(admin.id, client);
    const { passwordHash, failedLoginCount, lockedUntil, ...profile } = admin;
    return { admin: { ...profile, lastLoginAt }, tokens };
  }

  /** Swaps a refresh token for a new pair. A reused (already revoked) token ends every session. */
  async refresh(refreshToken: string | undefined, client: ClientInfo) {
    if (!refreshToken) throw sessionExpired();

    const session = await this.prisma.adminSession.findUnique({
      where: { refreshTokenHash: sha256(refreshToken) },
      include: { adminUser: { select: { status: true, deletedAt: true } } },
    });

    if (!session) throw sessionExpired();

    if (session.revokedAt) {
      await this.revokeAll(session.adminUserId);
      throw sessionExpired();
    }

    const { adminUser } = session;
    if (session.expiresAt <= new Date() || adminUser.status !== 'active' || adminUser.deletedAt) {
      throw sessionExpired();
    }

    await this.prisma.adminSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.startSession(session.adminUserId, client);
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;
    await this.prisma.adminSession.updateMany({
      where: { refreshTokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Used by the guard on every protected request. */
  async validateAccess(payload: AccessPayload): Promise<AdminProfile | null> {
    const session = await this.prisma.adminSession.findUnique({
      where: { id: payload.sid },
      select: { adminUserId: true, revokedAt: true, expiresAt: true },
    });
    if (!session || session.adminUserId !== payload.sub || session.revokedAt) return null;
    if (session.expiresAt <= new Date()) return null;

    return this.prisma.adminUser.findFirst({
      where: { id: payload.sub, status: 'active', deletedAt: null },
      select: adminSelect,
    });
  }

  private async startSession(adminUserId: string, client: ClientInfo): Promise<IssuedTokens> {
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
    const accessExpiresAt = new Date(Date.now() + env.ACCESS_TOKEN_TTL_MINUTES * 60_000);

    const session = await this.prisma.adminSession.create({
      data: {
        adminUserId,
        refreshTokenHash: sha256(refreshToken),
        expiresAt: refreshExpiresAt,
        ip: client.ip,
        userAgent: client.userAgent?.slice(0, 500),
      },
    });

    const payload: AccessPayload = { sub: adminUserId, sid: session.id, typ: 'admin' };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: env.ACCESS_TOKEN_TTL_MINUTES * 60,
    });

    return { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt };
  }

  private revokeAll(adminUserId: string) {
    return this.prisma.adminSession.updateMany({
      where: { adminUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
