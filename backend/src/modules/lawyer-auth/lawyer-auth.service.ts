import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { AppException } from '../../common/app-exception';
import { env } from '../../config/env';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { SocialProfile, SocialTokenService } from '../social-auth/social-token.service';

const lawyerSelect = {
  id: true,
  phone: true,
  email: true,
  fullName: true,
  status: true,
  suspensionReason: true,
  deletedAt: true,
  lastLoginAt: true,
  createdAt: true,
  lawyerProfile: {
    select: { onboardingStatus: true, rejectionReason: true },
  },
} satisfies Prisma.UserSelect;

type LawyerRow = Prisma.UserGetPayload<{ select: typeof lawyerSelect }>;

export interface LawyerPayload {
  sub: string;
  sid: string;
  typ: 'lawyer';
}

interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const toE164 = (mobile: string) => `+91${mobile}`;

const sessionExpired = () =>
  new AppException(HttpStatus.UNAUTHORIZED, 'SESSION_EXPIRED', 'Please sign in again.');

/** The reason, when an admin gave one, reads in the app's sign-out notice. */
const suspended = (reason?: string | null) =>
  new AppException(
    HttpStatus.FORBIDDEN,
    'ACCOUNT_SUSPENDED',
    reason
      ? `Your account has been suspended. Reason: ${reason}`
      : 'Your account has been suspended. Please contact support.',
  );

/** What the app receives about the signed-in lawyer. */
export function toLawyerResponse(user: LawyerRow) {
  return {
    id: user.id,
    mobile: user.phone,
    email: user.email,
    fullName: user.fullName,
    status: user.status,
    onboardingStatus: user.lawyerProfile?.onboardingStatus ?? 'draft',
    // So the app can explain a rejection without a second call.
    rejectionReason: user.lawyerProfile?.rejectionReason ?? null,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

@Injectable()
export class LawyerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly otp: OtpService,
    private readonly social: SocialTokenService,
  ) {}

  // ---- Mobile OTP ----

  sendMobileOtp(mobile: string) {
    return this.otp.send('sms', toE164(mobile), 'lawyer');
  }

  async verifyMobileOtp(mobile: string, code: string, client: ClientInfo) {
    const phone = toE164(mobile);
    await this.otp.verify('sms', phone, 'lawyer', code);

    let user = await this.prisma.user.findUnique({
      where: { phone_role: { phone, role: 'lawyer' } },
      select: lawyerSelect,
    });
    const isNewUser = !user;

    if (!user) {
      await this.assertPhoneFreeForLawyer(phone);
      user = await this.createLawyer({ phone });
    }

    return this.signIn(user, isNewUser, client);
  }

  // ---- Email OTP ----

  sendEmailOtp(email: string) {
    return this.otp.send('email', email, 'lawyer');
  }

  async verifyEmailOtp(email: string, code: string, client: ClientInfo) {
    await this.otp.verify('email', email, 'lawyer', code);

    let user = await this.prisma.user.findUnique({
      where: { email_role: { email, role: 'lawyer' } },
      select: lawyerSelect,
    });
    const isNewUser = !user;

    if (!user) {
      user = await this.createLawyer({ email, emailVerifiedAt: new Date() });
    } else if (!user.deletedAt) {
      await this.prisma.user.updateMany({
        where: { id: user.id, emailVerifiedAt: null },
        data: { emailVerifiedAt: new Date() },
      });
    }

    return this.signIn(user, isNewUser, client);
  }

  // ---- Google / Apple ----

  async loginWithGoogle(idToken: string, client: ClientInfo) {
    const profile = await this.social.verifyGoogle(idToken);
    return this.socialLogin('google', profile, client);
  }

  async loginWithApple(
    identityToken: string,
    rawNonce: string | undefined,
    fullName: string | undefined,
    client: ClientInfo,
  ) {
    const profile = await this.social.verifyApple(identityToken, rawNonce);
    return this.socialLogin('apple', { ...profile, name: fullName || null }, client);
  }

  /**
   * Finds the lawyer by linked provider account, then by verified email
   * (linking it), and otherwise creates a new lawyer.
   */
  private async socialLogin(provider: AuthProvider, profile: SocialProfile, client: ClientInfo) {
    const identity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId_role: {
          provider,
          providerUserId: profile.subject,
          role: 'lawyer',
        },
      },
      select: { user: { select: lawyerSelect } },
    });
    if (identity) return this.signIn(identity.user, false, client);

    const verifiedEmail = profile.emailVerified ? profile.email : null;
    const identityData = {
      provider,
      providerUserId: profile.subject,
      role: 'lawyer' as const,
      email: profile.email,
    };

    if (verifiedEmail) {
      const existing = await this.prisma.user.findUnique({
        where: { email_role: { email: verifiedEmail, role: 'lawyer' } },
        select: lawyerSelect,
      });
      if (existing) {
        if (!existing.deletedAt) {
          await this.prisma.authIdentity.create({ data: { ...identityData, userId: existing.id } });
        }
        return this.signIn(existing, false, client);
      }
    }

    const user = await this.createLawyer({
      email: verifiedEmail,
      emailVerifiedAt: verifiedEmail ? new Date() : null,
      fullName: profile.name,
      identities: { create: identityData },
    });
    return this.signIn(user, true, client);
  }

  // ---- Session ----

  /** Swaps a refresh token for a new pair. A reused (already revoked) token ends every session. */
  async refresh(refreshToken: string, client: ClientInfo) {
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: sha256(refreshToken) },
      include: {
        user: {
          select: {
            role: true,
            status: true,
            suspensionReason: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!session || session.user.role !== 'lawyer') throw sessionExpired();
    if (session.user.status === 'suspended') throw suspended(session.user.suspensionReason);

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

  /** Used by the guard on every protected request. */
  async validateAccess(payload: LawyerPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, role: 'lawyer', deletedAt: null },
      select: lawyerSelect,
    });
    if (!user) return null;

    // Checked before the session, which suspending revokes: a plain 401 would
    // leave the app signing the lawyer out with no idea why.
    if (user.status === 'suspended') throw suspended(user.suspensionReason);

    const session = await this.prisma.userSession.findUnique({
      where: { id: payload.sid },
      select: { userId: true, revokedAt: true, expiresAt: true },
    });
    if (!session || session.userId !== payload.sub || session.revokedAt) return null;
    if (session.expiresAt <= new Date()) return null;

    return user;
  }

  // ---- Helpers ----

  private async createLawyer(data: Omit<Prisma.UserCreateInput, 'role' | 'lawyerProfile'>) {
    return this.prisma.user.create({
      data: {
        ...data,
        role: 'lawyer',
        // "LAW0001" and up, counted only over lawyers.
        lawyerNumber: await this.nextLawyerNumber(),
        lawyerProfile: { create: {} },
      },
      select: lawyerSelect,
    });
  }

  /** The next value of `lawyer_number_seq`, created with the column. */
  private async nextLawyerNumber() {
    const [row] = await this.prisma.$queryRaw<
      { value: number }[]
    >`SELECT nextval('lawyer_number_seq')::int AS value`;
    return row.value;
  }

  private async assertPhoneFreeForLawyer(phone: string) {
    if (env.ALLOW_MULTI_ROLE_PHONE) return;
    const other = await this.prisma.user.findFirst({
      where: { phone, role: { not: 'lawyer' }, deletedAt: null },
      select: { id: true },
    });
    if (other) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'PHONE_USED_BY_OTHER_ROLE',
        'This number is already registered as a customer.',
      );
    }
  }

  /** Shared last step of every login method. */
  private async signIn(user: LawyerRow, isNewUser: boolean, client: ClientInfo) {
    if (user.deletedAt) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'ACCOUNT_DELETED',
        'This account was deleted. Please contact support.',
      );
    }
    if (user.status === 'suspended') throw suspended(user.suspensionReason);

    const lawyer = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: lawyerSelect,
    });

    const tokens = await this.startSession(lawyer.id, client);
    return { ...tokens, isNewUser, lawyer: toLawyerResponse(lawyer) };
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

    const payload: LawyerPayload = {
      sub: userId,
      sid: session.id,
      typ: 'lawyer',
    };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: env.ACCESS_TOKEN_TTL_MINUTES * 60,
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }
}
