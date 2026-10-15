import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, Prisma } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { AppException } from '../../common/app-exception';
import { checkFile, EXTENSIONS, FILE_RULES } from '../../common/file-rules';
import { env } from '../../config/env';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { OtpService } from '../otp/otp.service';
import { SocialTokenService, type SocialProfile } from '../social-auth/social-token.service';
import { ChangeContactDto, UpdateCustomerProfileDto, VerifyContactDto } from './dto/profile.dto';

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
/** One account per email and per number. */
const inUse = (what: 'email' | 'mobile') =>
  new AppException(
    HttpStatus.CONFLICT,
    what === 'email' ? 'EMAIL_IN_USE' : 'MOBILE_IN_USE',
    what === 'email'
      ? 'That email is already on another account.'
      : 'That mobile number is already on another account.',
  );

/** Asking to replace a contact that is already set, without a code. */
const mustVerify = (what: 'email' | 'mobile') =>
  new AppException(
    HttpStatus.CONFLICT,
    what === 'email' ? 'VERIFY_EMAIL_FIRST' : 'VERIFY_MOBILE_FIRST',
    what === 'email'
      ? 'Confirm the new email address with a code before changing it.'
      : 'Confirm the new mobile number with a code before changing it.',
  );

/**
 * What a customer still has to tell us before a report can be handed over,
 * said twice: once in words for the customer, once as keys so the app can
 * mark the right section without keeping its own copy of the rule.
 */
function completenessOf(profile: {
  fullName: string | null;
  gender: string | null;
  ageBand: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  address: string | null;
  languages: string[];
  mobile: string | null;
  email: string | null;
}) {
  const missing: string[] = [];
  const missingKeys: string[] = [];
  const need = (key: string, said: string) => {
    missingKeys.push(key);
    missing.push(said);
  };

  if (profile.fullName === null || profile.fullName.trim() === '') {
    need('fullName', 'your full name');
  }
  if (!profile.gender) need('gender', 'your gender');
  if (!profile.ageBand) need('ageBand', 'your age');
  if (!profile.city && !profile.state && !profile.pincode) {
    need('location', 'where you live');
  }
  if (!profile.address) need('address', 'your address');
  if (profile.languages.length === 0) need('languages', 'a language');

  // They signed in with one of these; we need the other to reach them.
  if (!profile.mobile) need('mobile', 'a mobile number');
  if (!profile.email) need('email', 'an email address');

  return { complete: missing.length === 0, missing, missingKeys };
}

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
    private readonly social: SocialTokenService,
    private readonly storage: StorageService,
  ) {}

  sendMobileOtp(mobile: string) {
    return this.otp.send('sms', toE164(mobile), 'customer');
  }

  /** Signing in with an email rather than a number. */
  sendEmailOtp(email: string) {
    return this.otp.send('email', email.toLowerCase(), 'customer');
  }

  async verifyEmailOtp(email: string, code: string, client: ClientInfo) {
    const address = email.toLowerCase();
    await this.otp.verify('email', address, 'customer', code);

    let user = await this.prisma.user.findUnique({
      where: { email_role: { email: address, role: 'customer' } },
      select: customerSelect,
    });
    const isNewUser = !user;

    if (!user) {
      user = await this.prisma.user.create({
        // Verified by definition: they just read the code we sent there.
        data: { email: address, role: 'customer', emailVerifiedAt: new Date() },
        select: customerSelect,
      });
    }

    return this.signIn(user, isNewUser, client);
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

  // ---- Google / Apple ----

  async loginWithGoogle(idToken: string, client: ClientInfo) {
    const profile = await this.social.verifyGoogle(idToken);
    return this.socialLogin(AuthProvider.google, profile, client);
  }

  /** Apple keeps the name out of the token, so the app sends it on the first sign-in. */
  async loginWithApple(
    identityToken: string,
    rawNonce: string | undefined,
    fullName: string | undefined,
    client: ClientInfo,
  ) {
    const profile = await this.social.verifyApple(identityToken, rawNonce);
    return this.socialLogin(AuthProvider.apple, { ...profile, name: fullName || null }, client);
  }

  /**
   * Finds the customer by linked provider account, then by verified email —
   * linking the two — and otherwise creates one.
   *
   * Only an email the provider says it has verified is matched on. An
   * unverified one would let anybody who can mint a token for an address
   * walk into the account that already owns it.
   */
  private async socialLogin(
    provider: AuthProvider,
    profile: SocialProfile,
    client: ClientInfo,
  ) {
    const identity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId_role: {
          provider,
          providerUserId: profile.subject,
          role: 'customer',
        },
      },
      select: { user: { select: customerSelect } },
    });
    if (identity) return this.signIn(identity.user, false, client);

    const verifiedEmail = profile.emailVerified ? profile.email : null;
    const identityData = {
      provider,
      providerUserId: profile.subject,
      role: 'customer' as const,
      email: profile.email,
    };

    if (verifiedEmail) {
      const existing = await this.prisma.user.findUnique({
        where: { email_role: { email: verifiedEmail, role: 'customer' } },
        select: customerSelect,
      });
      if (existing) {
        // Someone who signed up by email code and is now using the button
        // for the same address: the same person, so link rather than
        // refuse or duplicate.
        if (!existing.deletedAt) {
          await this.prisma.authIdentity.create({ data: { ...identityData, userId: existing.id } });
        }
        return this.signIn(existing, false, client);
      }
    }

    const user = await this.prisma.user.create({
      data: {
        role: 'customer',
        email: verifiedEmail,
        emailVerifiedAt: verifiedEmail ? new Date() : null,
        fullName: profile.name,
        identities: { create: identityData },
      },
      select: customerSelect,
    });
    return this.signIn(user, true, client);
  }

  /**
   * The customer's own details.
   *
   * Only what is sent is written, so the sign-up form and the profile
   * screen — which each fill in a different part of this — never wipe each
   * other's answers.
   */
  async updateProfile(userId: string, dto: UpdateCustomerProfileDto) {
    const { fullName, email, mobile, ...profile } = dto;

    const current = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, phone: true },
    });

    // Filling in the contact they do not have yet is free; replacing one
    // they already have is not. A report and every future code go to these,
    // so an account cannot be quietly pointed at a different inbox or
    // handset without a code proving it belongs to them.
    const nextEmail = email === undefined ? undefined : email.toLowerCase();
    const nextPhone = mobile === undefined ? undefined : toE164(mobile);

    if (nextEmail !== undefined && current.email && nextEmail !== current.email) {
      throw mustVerify('email');
    }
    if (nextPhone !== undefined && current.phone && nextPhone !== current.phone) {
      throw mustVerify('mobile');
    }

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(fullName !== undefined ? { fullName } : {}),
          ...(nextEmail !== undefined && !current.email ? { email: nextEmail } : {}),
          ...(nextPhone !== undefined && !current.phone ? { phone: nextPhone } : {}),
        },
      });
    } catch (error) {
      // One account per email and per number: say which, rather than
      // failing with "something went wrong", which tells the customer
      // nothing they can act on.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw inUse(String(error.meta?.target ?? '').includes('phone') ? 'mobile' : 'email');
      }
      throw error;
    }

    if (Object.keys(profile).length > 0) {
      await this.prisma.customerProfile.upsert({
        where: { userId },
        create: { userId, ...profile },
        update: profile,
      });
    }

    return this.profile(userId);
  }

  /**
   * Whether the customer has told us enough for their consultation report.
   *
   * The report is a legal document that goes out in their name, so it is
   * gated on this — not the booking, which anyone can do with just the
   * number or email they signed in with.
   */
  async completeness(userId: string) {
    return completenessOf(await this.profile(userId));
  }

  /**
   * Sends a code to the address or number they want to move to.
   *
   * The code goes to the *new* contact, never the old one: proving you can
   * read the new inbox is the whole point.
   */
  async sendContactOtp(userId: string, dto: ChangeContactDto) {
    const { channel, target } = await this.contactChange(userId, dto);
    return this.otp.send(channel, target, 'customer');
  }

  /** Confirms the code and moves the contact across. */
  async verifyContactOtp(userId: string, dto: VerifyContactDto) {
    const { channel, target } = await this.contactChange(userId, dto);

    await this.otp.verify(channel, target, 'customer', dto.otp);

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data:
          channel === 'email'
            ? { email: target, emailVerifiedAt: new Date() }
            : { phone: target },
      });
    } catch (error) {
      // Someone claimed it between sending the code and using it.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw inUse(channel === 'email' ? 'email' : 'mobile');
      }
      throw error;
    }

    return this.profile(userId);
  }

  /**
   * Works out what is being changed to what, and refuses early for the
   * reasons worth refusing for — so nobody waits for a code that was never
   * going to be accepted.
   */
  private async contactChange(userId: string, dto: ChangeContactDto) {
    if ((dto.email === undefined) === (dto.mobile === undefined)) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'ONE_CONTACT',
        'Send either an email address or a mobile number.',
      );
    }

    const channel = dto.email !== undefined ? ('email' as const) : ('sms' as const);
    const target = dto.email !== undefined ? dto.email.toLowerCase() : toE164(dto.mobile!);

    const current = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, phone: true },
    });
    if (target === (channel === 'email' ? current.email : current.phone)) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CONTACT_UNCHANGED',
        channel === 'email'
          ? 'That is already your email address.'
          : 'That is already your mobile number.',
      );
    }

    const taken = await this.prisma.user.findFirst({
      where: channel === 'email' ? { email: target } : { phone: target },
      select: { id: true },
    });
    if (taken && taken.id !== userId) throw inUse(channel === 'email' ? 'email' : 'mobile');

    return { channel, target };
  }

  /** Replaces the profile photo, dropping the one it stands in for. */
  async savePhoto(userId: string, file: Express.Multer.File | undefined) {
    if (!file) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'FILE_REQUIRED', 'Choose a photo.');
    }

    const mimeType = checkFile(file, FILE_RULES.profileImage, 'Profile photo');
    const key = `customers/${userId}/photo/${randomUUID()}${EXTENSIONS[mimeType]}`;
    await this.storage.put(key, file.buffer, mimeType);

    const previous = await this.prisma.customerProfile.findUnique({
      where: { userId },
      select: { photoKey: true },
    });

    await this.prisma.customerProfile.upsert({
      where: { userId },
      create: { userId, photoKey: key },
      update: { photoKey: key },
    });

    // Only once the new one is safely the live record.
    if (previous?.photoKey) await this.storage.delete(previous.photoKey);

    return this.profile(userId);
  }

  /** The photo itself, for the app to render. */
  async photo(userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
      select: { photoKey: true },
    });
    if (!profile?.photoKey) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NO_PHOTO', 'No photo has been uploaded.');
    }

    return {
      body: await this.storage.get(profile.photoKey),
      mimeType: profile.photoKey.endsWith('.png') ? 'image/png' : 'image/jpeg',
    };
  }

  /** Everything the profile screen shows, in one call. */
  async profile(userId: string) {
    const [user, profile] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: customerSelect,
      }),
      this.prisma.customerProfile.findUnique({ where: { userId } }),
    ]);

    const details = {
      ...toCustomerResponse(user),
      /** Cache-busted, so a new photo shows the moment it is uploaded. */
      photoUrl: profile?.photoKey
        ? `/api/v1/customer/auth/profile/photo?v=${profile.updatedAt.getTime()}`
        : null,
      prefix: profile?.prefix ?? null,
      gender: profile?.gender ?? null,
      ageBand: profile?.ageBand ?? null,
      maritalStatus: profile?.maritalStatus ?? null,
      occupation: profile?.occupation ?? null,
      state: profile?.state ?? null,
      city: profile?.city ?? null,
      pincode: profile?.pincode ?? null,
      address: profile?.address ?? null,
      languages: profile?.languages ?? [],
      referredByCode: profile?.referredByCode ?? null,
    };

    // The screen shows a dot per section against exactly the rule the
    // report is held back by, rather than its own copy of it.
    return { ...details, ...completenessOf(details) };
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
