import { HttpStatus, Injectable } from '@nestjs/common';
import { ConsultationStatus, Prisma } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { consultationCode } from '../../common/consultation-code';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ListConsultationsDto } from './dto/consultation.dto';

const notFound = () =>
  new AppException(HttpStatus.NOT_FOUND, 'CONSULTATION_NOT_FOUND', 'Consultation not found.');

/** The tabs in the sidebar, and what each one means in the database. */
const BUCKETS = {
  completed: { status: { in: [ConsultationStatus.completed] } },
  'in-progress': {
    status: {
      in: [ConsultationStatus.searching, ConsultationStatus.assigned, ConsultationStatus.active],
    },
  },
  cancelled: {
    status: { in: [ConsultationStatus.cancelled, ConsultationStatus.no_lawyer] },
  },
  // Not a status of its own: a consultation is "refunded" when money went
  // back, whatever happened to the booking itself.
  refunded: { payment: { refundAmount: { gt: 0 } } },
} satisfies Record<string, Prisma.ConsultationRequestWhereInput>;

export type Bucket = keyof typeof BUCKETS;

const rowSelect = {
  id: true,
  number: true,
  planName: true,
  durationMinutes: true,
  category: true,
  amount: true,
  status: true,
  createdAt: true,
  customer: { select: { id: true, fullName: true } },
  lawyer: { select: { id: true, fullName: true } },
  updatedAt: true,
  session: { select: { startedAt: true, endedAt: true, endedBy: true, talkedSeconds: true } },
  payment: {
    select: { amount: true, status: true, refundAmount: true, refundReason: true, paidAt: true },
  },
} satisfies Prisma.ConsultationRequestSelect;

type Row = Prisma.ConsultationRequestGetPayload<{ select: typeof rowSelect }>;

@Injectable()
export class AdminConsultationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Headline counts for the tabs. */
  async metrics() {
    const [completed, inProgress, cancelled, refunded] = await this.prisma.$transaction([
      this.prisma.consultationRequest.count({ where: BUCKETS.completed }),
      this.prisma.consultationRequest.count({ where: BUCKETS['in-progress'] }),
      this.prisma.consultationRequest.count({ where: BUCKETS.cancelled }),
      this.prisma.consultationRequest.count({ where: BUCKETS.refunded }),
    ]);

    return { completed, inProgress, cancelled, refunded };
  }

  async list(bucket: Bucket, dto: ListConsultationsDto) {
    const search = dto.search?.trim();
    const where: Prisma.ConsultationRequestWhereInput = {
      ...BUCKETS[bucket],
      ...(search
        ? {
            OR: [
              { customer: { fullName: { contains: search, mode: 'insensitive' } } },
              { lawyer: { fullName: { contains: search, mode: 'insensitive' } } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 50;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.consultationRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        select: rowSelect,
      }),
      this.prisma.consultationRequest.count({ where }),
    ]);

    return { data: rows.map((row) => toRow(row)), total, page, perPage };
  }

  async detail(id: string) {
    const row = await this.prisma.consultationRequest.findUnique({
      where: { id },
      select: {
        ...rowSelect,
        description: true,
        report: { select: { status: true, submittedAt: true, caseSummary: true } },
        earning: { select: { gross: true, commission: true, net: true, status: true } },
      },
    });
    if (!row) throw notFound();

    return {
      ...toRow(row),
      description: row.description,
      report: row.report
        ? {
            status: row.report.status,
            submittedAt: row.report.submittedAt,
            summary: row.report.caseSummary || null,
          }
        : null,
      earning: row.earning,
    };
  }
}

/** One consultation as every admin table shows it. */
function toRow(row: Row) {
  const refundAmount = row.payment?.refundAmount ?? 0;
  const fee = row.payment?.status === 'paid' ? row.payment.amount : row.amount;

  return {
    id: row.id,
    consultationId: consultationCode(row.number),
    customer: row.customer?.fullName ?? 'Unnamed customer',
    customerId: row.customer?.id ?? null,
    lawyer: row.lawyer?.fullName ?? null,
    lawyerId: row.lawyer?.id ?? null,
    category: row.category,
    planName: row.planName,
    duration: row.durationMinutes,
    /** Seconds both sides were actually in the call. */
    talkedSeconds: row.session?.talkedSeconds ?? 0,
    date: row.createdAt,
    startedAt: row.session?.startedAt ?? null,
    endedAt: row.session?.endedAt ?? null,
    fee,
    status: row.status,
    // There is no cancellation record of its own; who ended the session is
    // the closest the schema has.
    cancelledAt: row.status === 'cancelled' ? row.updatedAt : null,
    cancelledBy: row.session?.endedBy ?? null,
    reason: row.payment?.refundReason ?? null,
    refundAmount,
    refundedAt: refundAmount > 0 ? row.payment?.paidAt ?? null : null,
    refundPercent: refundAmount > 0 && fee > 0 ? Math.round((refundAmount / fee) * 100) : 0,
    paymentStatus: row.payment?.status ?? null,
  };
}
