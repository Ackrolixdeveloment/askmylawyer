import { HttpStatus, Injectable } from '@nestjs/common';
import { ConsultationStatus, Prisma, UserStatus } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { consultationCode } from '../../common/consultation-code';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ListCustomersDto, UpdateCustomerDto } from './dto/customer.dto';

const notFound = () =>
  new AppException(HttpStatus.NOT_FOUND, 'CUSTOMER_NOT_FOUND', 'Customer not found.');

/** A customer the admin may act on: never a lawyer, never already deleted. */
const live = { role: 'customer', deletedAt: null } as const;

/** Consultations that count as "used the service". */
const COMPLETED: ConsultationStatus[] = [ConsultationStatus.completed];

@Injectable()
export class AdminCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /** The four cards above the table. */
  async metrics() {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60_000);

    const [total, active, recent, suspended] = await this.prisma.$transaction([
      this.prisma.user.count({ where: live }),
      // "Active" is about use, not account status: someone who has signed in
      // this month. An account nobody opens is not an active customer.
      this.prisma.user.count({
        where: { ...live, status: UserStatus.active, lastLoginAt: { gte: monthAgo } },
      }),
      this.prisma.user.count({ where: { ...live, createdAt: { gte: monthAgo } } }),
      this.prisma.user.count({ where: { ...live, status: UserStatus.suspended } }),
    ]);

    return { total, active, newRegistrations: recent, suspended };
  }

  /** The table, filtered and paged. */
  async list(dto: ListCustomersDto) {
    const search = dto.search?.trim();
    const where: Prisma.UserWhereInput = {
      ...live,
      ...(dto.status ? { status: dto.status } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          customerProfile: { select: { city: true, state: true } },
          _count: { select: { consultations: { where: { status: { in: COMPLETED } } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.fullName ?? 'Unnamed customer',
        contact: row.phone ?? row.email ?? '',
        city: row.customerProfile?.city ?? row.customerProfile?.state ?? '',
        joinedOn: row.createdAt,
        consults: row._count.consultations,
        lastActiveOn: row.lastLoginAt,
        status: row.status,
      })),
      total,
      page,
      perPage,
    };
  }

  /** Everything the detail screen shows. */
  async detail(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, ...live },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        customerProfile: true,
      },
    });
    if (!user) throw notFound();

    const profile = user.customerProfile;

    const consultations = await this.prisma.consultationRequest.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        number: true,
        planName: true,
        status: true,
        category: true,
        amount: true,
        createdAt: true,
        lawyer: { select: { fullName: true } },
        payment: {
          select: { amount: true, status: true, method: true, paidAt: true, refundAmount: true, refundReason: true },
        },
      },
    });

    const consultationTotal = await this.prisma.consultationRequest.count({
      where: { customerId: id },
    });

    return {
      id: user.id,
      name: user.fullName ?? 'Unnamed customer',
      status: user.status,
      city: profile?.city ?? '',
      personal: {
        fullName: user.fullName,
        email: user.email,
        mobile: user.phone,
        gender: profile?.gender ?? null,
        ageBand: profile?.ageBand ?? null,
        languages: profile?.languages ?? [],
        maritalStatus: profile?.maritalStatus ?? null,
        occupation: profile?.occupation ?? null,
        city: profile?.city ?? null,
        state: profile?.state ?? null,
        pincode: profile?.pincode ?? null,
        address: profile?.address ?? null,
      },
      joinedOn: user.createdAt,
      consultationTotal,
      consultations: consultations.map((row) => ({
        id: row.id,
        reference: consultationCode(row.number),
        lawyer: row.lawyer?.fullName ?? null,
        category: row.category,
        planName: row.planName,
        date: row.createdAt,
        status: row.status,
        amount: row.payment?.status === 'paid' ? row.payment.amount : row.amount,
        refunded: (row.payment?.refundAmount ?? 0) > 0,
      })),
      // Money in and out, taken from the consultation payments — there is no
      // separate wallet.
      transactions: consultations
        .filter((row) => row.payment?.paidAt)
        .map((row) => ({
          id: row.id,
          type: (row.payment!.refundAmount ?? 0) > 0 ? ('Credit' as const) : ('Debit' as const),
          amount: (row.payment!.refundAmount ?? 0) > 0 ? row.payment!.refundAmount! : row.payment!.amount,
          method: row.payment!.method ?? 'online',
          date: row.payment!.paidAt!,
          reference: consultationCode(row.number),
        })),
      refunds: consultations
        .filter((row) => (row.payment?.refundAmount ?? 0) > 0)
        .map((row) => ({
          id: row.id,
          reason: row.payment!.refundReason ?? 'Refunded',
          amount: row.payment!.refundAmount!,
          requestedOn: row.createdAt,
        })),
      // No referral or support module yet: empty rather than invented.
      referral: null,
      supportTickets: [],
    };
  }

  /** Changes the details an admin is allowed to correct. */
  async update(id: string, dto: UpdateCustomerDto) {
    const exists = await this.prisma.user.findFirst({ where: { id, ...live }, select: { id: true } });
    if (!exists) throw notFound();

    const { fullName, email, mobile, status, ...profile } = dto;

    try {
      await this.prisma.user.update({
        where: { id },
        data: {
          ...(fullName !== undefined ? { fullName } : {}),
          ...(email !== undefined ? { email: email.toLowerCase() } : {}),
          ...(mobile !== undefined ? { phone: mobile } : {}),
          ...(status !== undefined ? { status } : {}),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const onPhone = String(error.meta?.target ?? '').includes('phone');
        throw new AppException(
          HttpStatus.CONFLICT,
          onPhone ? 'MOBILE_IN_USE' : 'EMAIL_IN_USE',
          onPhone
            ? 'That mobile number is already on another account.'
            : 'That email is already on another account.',
        );
      }
      throw error;
    }

    if (Object.keys(profile).length > 0) {
      await this.prisma.customerProfile.upsert({
        where: { userId: id },
        create: { userId: id, ...profile },
        update: profile,
      });
    }

    return this.detail(id);
  }

  /**
   * Removes the customer.
   *
   * Soft, deliberately: consultations, payments and the lawyer's earnings
   * all point at this row, and the money record has to survive someone
   * closing their account.
   */
  async remove(id: string) {
    const customer = await this.prisma.user.findFirst({
      where: { id, ...live },
      select: { id: true },
    });
    if (!customer) throw notFound();

    const live_ = await this.prisma.consultationRequest.count({
      where: {
        customerId: id,
        status: { in: [ConsultationStatus.searching, ConsultationStatus.assigned, ConsultationStatus.active] },
      },
    });
    if (live_ > 0) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'CUSTOMER_IN_CONSULTATION',
        'This customer is in a consultation right now. Try again once it has finished.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date(), status: UserStatus.suspended },
      }),
      // Sessions go too, or the app keeps working until the token expires.
      this.prisma.userSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { deleted: true };
  }
}
