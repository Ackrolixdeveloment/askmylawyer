import { HttpStatus, Injectable } from '@nestjs/common';
import { EarningStatus } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { consultationCode } from '../../common/consultation-code';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const notFound = () =>
  new AppException(HttpStatus.NOT_FOUND, 'EARNING_NOT_FOUND', 'Earning not found.');

/** Midnight on the first of this month. */
function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * What a lawyer has earned, and what they can have.
 *
 * Money is booked the moment a consultation closes and held until its
 * report is sent — so the balance a lawyer sees is only ever what is
 * genuinely theirs.
 */
@Injectable()
export class EarningsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The commission screen: three figures and the recent list. */
  async summary(lawyerId: string) {
    const rows = await this.prisma.lawyerEarning.findMany({
      where: { lawyerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        gross: true,
        commission: true,
        net: true,
        status: true,
        heldReason: true,
        createdAt: true,
        releasedAt: true,
        request: {
          select: {
            number: true,
            planName: true,
            planCode: true,
            category: true,
            durationMinutes: true,
            createdAt: true,
            customer: { select: { fullName: true } },
          },
        },
      },
    });

    const sum = (status: EarningStatus) =>
      rows
        .filter((row) => row.status === status)
        .reduce((total, row) => total + row.net, 0);

    const from = startOfMonth();
    const thisMonth = rows.filter((row) => row.createdAt >= from);

    return {
      /** Theirs, waiting on a payout. */
      creditBalance: sum(EarningStatus.available),
      /** Held back until the consultation report is sent. */
      underProcess: sum(EarningStatus.held),
      underProcessCount: rows.filter((row) => row.status === EarningStatus.held).length,
      /** Everything earned this month, held or not. */
      thisMonth: thisMonth.reduce((total, row) => total + row.net, 0),
      thisMonthSessions: thisMonth.length,
      data: rows.map((row) => this.toEarning(row)),
    };
  }

  /** One earning, broken down. */
  async detail(lawyerId: string, id: string) {
    const row = await this.prisma.lawyerEarning.findFirst({
      where: { id, lawyerId },
      select: {
        id: true,
        gross: true,
        commission: true,
        net: true,
        status: true,
        heldReason: true,
        createdAt: true,
        releasedAt: true,
        paidOutAt: true,
        request: {
          select: {
            number: true,
            planName: true,
            planCode: true,
            category: true,
            durationMinutes: true,
            createdAt: true,
            customer: { select: { fullName: true } },
          },
        },
      },
    });
    if (!row) throw notFound();

    return {
      ...this.toEarning(row),
      /** What the client paid, and the platform's share of it. */
      gross: row.gross,
      commission: row.commission,
      commissionPercent:
        row.gross > 0 ? Math.round((row.commission / row.gross) * 100) : 0,
      paidOutAt: row.paidOutAt,
      /**
       * Payouts are not built yet, so there is no bank account or reference
       * to show. Null rather than an invented one.
       */
      bankAccount: null,
      payoutReference: null,
    };
  }

  private toEarning(row: {
    id: string;
    net: number;
    status: EarningStatus;
    heldReason: string | null;
    createdAt: Date;
    releasedAt: Date | null;
    request: {
      number: number | null;
      planName: string;
      planCode: string;
      category: string | null;
      durationMinutes: number;
      createdAt: Date;
      customer: { fullName: string | null };
    };
  }) {
    return {
      id: row.id,
      reference: consultationCode(row.request.number),
      client: row.request.customer.fullName ?? 'Client',
      category: row.request.category,
      planName: row.request.planName,
      planCode: row.request.planCode,
      durationMinutes: row.request.durationMinutes,
      net: row.net,
      status: row.status,
      /** Why it is not theirs yet, in words they can act on. */
      heldReason: row.heldReason,
      at: row.request.createdAt,
      releasedAt: row.releasedAt,
    };
  }
}
