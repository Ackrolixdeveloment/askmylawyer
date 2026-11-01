import { HttpStatus, Injectable } from '@nestjs/common';
import { ConsultationStatus, Prisma } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { consultationCode } from '../../common/consultation-code';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { buildConsultationWhere } from './consultation-list-query';
import { ListConsultationsDto } from './dto/consultation.dto';

const notFound = () =>
  new AppException(HttpStatus.NOT_FOUND, 'CONSULTATION_NOT_FOUND', 'Consultation not found.');

/** The tabs in the sidebar, and what each one means in the database. */
const BUCKETS = {
  all: {},
  scheduled: { status: { in: [ConsultationStatus.scheduled] } },
  reports: { OR: [{ report: { status: { in: ['generating', 'awaiting_review', 'failed'] } } }, { status: ConsultationStatus.completed, report: null }] },
  completed: { status: { in: [ConsultationStatus.completed] } },
  'in-progress': {
    status: {
      in: [ConsultationStatus.searching, ConsultationStatus.assigned, ConsultationStatus.active],
    },
  },
  cancelled: {
    status: { in: [ConsultationStatus.cancelled, ConsultationStatus.no_lawyer] },
  },
  // Includes pending requests and historical records awaiting reconciliation.
  refunded: { OR: [{ payment: { refundStatus: { not: null } } }, { status: ConsultationStatus.refunded }] },
} satisfies Record<string, Prisma.ConsultationRequestWhereInput>;

export type Bucket = keyof typeof BUCKETS;

const rowSelect = {
  id: true,
  number: true,
  planName: true,
  durationMinutes: true,
  category: true,
  amount: true,
  paymentBypassed: true,
  cancelledBy: true,
  cancellationReason: true,
  status: true,
  createdAt: true,
  scheduledFor: true,
  report: { select: { status: true, submittedAt: true } },
  customer: { select: { id: true, fullName: true } },
  _count: { select: { messages: true } },
  lawyer: { select: { id: true, fullName: true, lawyerNumber: true } },
  updatedAt: true,
  session: { select: { readyAt: true, startedAt: true, endedAt: true, endedBy: true, talkedSeconds: true, usedModes: true, mediaUsageKnown: true } },
  payment: {
    select: { provider: true, environment: true, amount: true, status: true, refundAmount: true, refundReason: true, paidAt: true, refundedAt: true, refundStatus: true, refundRequestedAt: true, orderId: true, method: true, reference: true },
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
    const term = dto.search?.trim();
    const searchIds = term && /^[0-9a-f-]{4,36}$/i.test(term) ? await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM consultation_requests WHERE id::text ILIKE ${term + '%'} OR customer_id::text ILIKE ${term + '%'} OR lawyer_id::text ILIKE ${term + '%'}
    ` : [];
    const refunds = ['refunded', 'partially_refunded'].includes(dto.paymentState ?? '') ? await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT request_id AS id FROM consultation_payments WHERE refund_status = 'completed' AND ${dto.paymentState === 'refunded' ? Prisma.sql`refund_amount >= amount` : Prisma.sql`refund_amount < amount`}
    `) : [];
    const where = buildConsultationWhere(BUCKETS[bucket], dto, { search: searchIds.map(r => r.id), refunds: refunds.map(r => r.id) });
    const direction = dto.direction ?? 'desc';
    const sort: Prisma.ConsultationRequestOrderByWithRelationInput = dto.sortBy === 'consultationId' ? { number: direction } : dto.sortBy === 'slot' ? { scheduledFor: { sort: direction, nulls: 'last' } } : dto.sortBy === 'customer' ? { customer: { fullName: direction } } : dto.sortBy === 'lawyer' ? { lawyer: { fullName: direction } } : dto.sortBy === 'fee' ? { amount: direction } : dto.sortBy === 'status' ? { status: direction } : { createdAt: direction };

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 50;

    const [rows, total, bucketTotal] = await this.prisma.$transaction([
      this.prisma.consultationRequest.findMany({
        where,
        orderBy: [sort, { id: direction }],
        skip: (page - 1) * perPage,
        take: perPage,
        select: rowSelect,
      }),
      this.prisma.consultationRequest.count({ where }),
      this.prisma.consultationRequest.count({ where: BUCKETS[bucket] }),
    ]);

    return { data: rows.map((row) => toRow(row)), total, bucketTotal, page, perPage };
  }

  async people(role: 'customer' | 'lawyer', q: string) {
    const term = '%' + q.trim() + '%';
    const lawyerNumber = /^LAW[-\s]*0*(\d+)$/i.exec(q.trim());
    const rows = await this.prisma.$queryRaw<Array<{ id: string; name: string | null; lawyerNumber: number | null }>>`
      SELECT id, full_name AS name, lawyer_number AS "lawyerNumber" FROM users
      WHERE role::text = ${role} AND deleted_at IS NULL AND (full_name ILIKE ${term} OR phone ILIKE ${term} OR email ILIKE ${term} OR id::text ILIKE ${term} OR ('LAW' || lpad(lawyer_number::text, GREATEST(4, length(lawyer_number::text)), '0')) ILIKE ${term} OR lawyer_number = ${lawyerNumber && Number(lawyerNumber[1]) <= 2147483647 ? Number(lawyerNumber[1]) : -1})
      ORDER BY full_name ASC NULLS LAST, id LIMIT 20
    `;
    return { data: rows.map(row => ({ id: row.id, name: row.name ?? (role === 'customer' ? 'Name not provided' : 'Lawyer'), displayId: role === 'lawyer' && row.lawyerNumber ? `LAW${String(row.lawyerNumber).padStart(4, '0')}` : row.id.slice(0, 8).toUpperCase() })) };
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

  const isTest = row.paymentBypassed || row.payment?.provider === 'bypass' || row.payment?.environment === 'sandbox' || row.payment?.method === 'bypass' || row.payment?.reference === 'BYPASS-NO-PAYMENT-TAKEN';
  const paid = row.payment?.status === 'paid' || row.payment?.status === 'refunded';
  const paymentState = isTest ? 'test' : row.payment?.refundStatus === 'completed' ? (refundAmount >= (row.payment?.amount ?? 0) ? 'refunded' : 'partially_refunded') : row.payment?.refundStatus ? 'refund_pending' : paid ? 'paid' : row.payment?.status === 'failed' ? 'failed' : row.payment?.status === 'created' || row.status === 'pending_payment' ? 'pending' : row.amount === 0 && !row.payment ? 'free' : 'not_recorded';
  const usedModes = [...new Set([...(row.session?.usedModes ?? []), ...((row._count?.messages ?? 0) > 0 ? ['chat'] : [])])];
  const reportState = row.report?.status === 'delivered' ? 'delivered' : !row.report && ['cancelled', 'no_lawyer', 'refunded'].includes(row.status) && !row.session?.startedAt ? 'not_applicable' : 'pending';
  return {
    customerDisplayId: row.customer?.id?.slice(0, 8).toUpperCase() ?? null,
    lawyerDisplayId: row.lawyer?.lawyerNumber ? `LAW${String(row.lawyer.lawyerNumber).padStart(4, '0')}` : row.lawyer?.id?.slice(0, 8).toUpperCase() ?? null,
    usedModes,
    mediaUsageKnown: row.session?.mediaUsageKnown ?? false,
    collectedAmount: isTest || paymentState === 'free' || paymentState === 'pending' || paymentState === 'failed' ? 0 : paid ? row.payment!.amount : null,
    paymentState,
    reportState,
    reportSubmittedAt: row.report?.submittedAt ?? null,
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
    scheduledFor: row.scheduledFor,
    readyAt: row.session?.readyAt ?? null,
    reportStatus: row.report?.status ?? null,
    startedAt: row.session?.startedAt ?? null,
    endedAt: row.session?.endedAt ?? null,
    fee,
    status: row.status,
    // There is no cancellation record of its own; who ended the session is
    // the closest the schema has.
    cancelledAt: row.status === 'cancelled' ? row.updatedAt : null,
    cancelledBy: row.cancelledBy ?? (row.status === 'cancelled' ? row.session?.endedBy : null) ?? null,
    reason: row.cancellationReason ?? row.payment?.refundReason ?? null,
    refundAmount,
    refundedAt: row.payment?.refundStatus === 'completed' ? row.payment.refundedAt : null,
    refundStatus: row.payment?.refundStatus ?? (row.status === 'refunded' ? 'needs_review' : null),
    refundRequestedAt: row.payment?.refundRequestedAt ?? null,
    paymentId: row.payment?.orderId ?? null,
    paymentMethod: row.payment?.method ?? null,
    paidAt: row.payment?.paidAt ?? null,
    refundPercent: refundAmount > 0 && fee > 0 ? Math.round((refundAmount / fee) * 100) : 0,
    paymentStatus: row.payment?.status ?? null,
  };
}
