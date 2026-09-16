import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { OtpService } from '../otp/otp.service';

const toE164 = (mobile: string) => `+91${mobile}`;

const inUse = (what: 'mobile number' | 'email address') =>
  new AppException(
    HttpStatus.CONFLICT,
    what === 'mobile number' ? 'MOBILE_IN_USE' : 'EMAIL_IN_USE',
    `This ${what} is already used by another lawyer account.`,
  );

/**
 * Changing the phone or email a lawyer signs in with. Both are verified by
 * OTP before they replace what is on the account.
 */
@Injectable()
export class LawyerAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
  ) {}

  async sendMobileOtp(userId: string, mobile: string) {
    const phone = toE164(mobile);
    await this.assertFree({ phone }, userId, 'mobile number');
    return this.otp.send('sms', phone, 'lawyer');
  }

  async verifyMobile(userId: string, mobile: string, code: string) {
    const phone = toE164(mobile);
    await this.assertFree({ phone }, userId, 'mobile number');
    await this.otp.verify('sms', phone, 'lawyer', code);

    return this.update(userId, { phone }, 'mobile number');
  }

  async sendEmailOtp(userId: string, email: string) {
    await this.assertEmailChangeable(userId);
    await this.assertFree({ email }, userId, 'email address');
    return this.otp.send('email', email, 'lawyer');
  }

  async verifyEmail(userId: string, email: string, code: string) {
    await this.assertEmailChangeable(userId);
    await this.assertFree({ email }, userId, 'email address');
    await this.otp.verify('email', email, 'lawyer', code);

    return this.update(userId, { email, emailVerifiedAt: new Date() }, 'email address');
  }

  // ---- Helpers ----

  /** A Google or Apple address belongs to that provider, so it stays put. */
  private async assertEmailChangeable(userId: string) {
    const linked = await this.prisma.authIdentity.findFirst({
      where: { userId },
      select: { provider: true },
    });

    if (linked) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'EMAIL_LOCKED_TO_PROVIDER',
        `Your email comes from your ${linked.provider === 'google' ? 'Google' : 'Apple'} account and cannot be changed here.`,
      );
    }
  }

  private async assertFree(
    where: { phone?: string; email?: string },
    userId: string,
    what: 'mobile number' | 'email address',
  ) {
    const taken = await this.prisma.user.findFirst({
      where: { ...where, role: 'lawyer', deletedAt: null, id: { not: userId } },
      select: { id: true },
    });
    if (taken) throw inUse(what);
  }

  private async update(
    userId: string,
    data: Prisma.UserUpdateInput,
    what: 'mobile number' | 'email address',
  ) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: { phone: true, email: true, emailVerifiedAt: true },
      });

      return {
        mobile: user.phone,
        email: user.email,
        emailVerified: Boolean(user.emailVerifiedAt),
      };
    } catch (error) {
      // Lost a race for the same number / address.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw inUse(what);
      }
      throw error;
    }
  }
}
