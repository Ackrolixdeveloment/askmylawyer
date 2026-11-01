import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { ListConsultationsDto } from './dto/consultation.dto';

const test: Prisma.ConsultationRequestWhereInput = { OR: [{ paymentBypassed: true }, { payment: { OR: [{ provider: 'bypass' }, { method: 'bypass' }, { environment: 'sandbox' }, { reference: 'BYPASS-NO-PAYMENT-TAKEN' }] } }] };
const notApplicable: Prisma.ConsultationRequestWhereInput = { status: { in: ['cancelled', 'no_lawyer', 'refunded'] }, report: null, OR: [{ session: null }, { session: { startedAt: null } }] };

export function buildConsultationWhere(bucket: Prisma.ConsultationRequestWhereInput, dto: ListConsultationsDto, ids: { search?: string[]; refunds?: string[] } = {}): Prisma.ConsultationRequestWhereInput {
  const conditions: Prisma.ConsultationRequestWhereInput[] = [bucket];
  if (dto.customerId) conditions.push({ customerId: dto.customerId });
  if (dto.lawyerId) conditions.push({ lawyerId: dto.lawyerId });
  if (dto.assignment) conditions.push({ lawyerId: dto.assignment === 'unassigned' ? null : { not: null } });
  if (dto.bookingMode) conditions.push({ scheduledFor: dto.bookingMode === 'instant' ? null : { not: null } });
  if (dto.status === 'preparing') conditions.push({ status: 'assigned', session: { readyAt: { gt: new Date() } } });
  else if (dto.status === 'waiting') conditions.push({ status: 'assigned', OR: [{ session: { readyAt: null } }, { session: { readyAt: { lte: new Date() } } }] });
  else if (dto.status) conditions.push({ status: dto.status as any });
  if (dto.medium === 'chat') conditions.push({ messages: { some: {} } });
  else if (dto.medium === 'unknown') conditions.push({ AND: [{ OR: [{ session: null }, { session: { mediaUsageKnown: false } }] }, { messages: { none: {} } }] });
  else if (dto.medium) conditions.push({ session: { usedModes: { has: dto.medium } } });
  if (dto.reportState) conditions.push(dto.reportState === 'delivered' ? { report: { status: 'delivered' } } : dto.reportState === 'not_applicable' ? notApplicable : { AND: [{ NOT: { report: { status: 'delivered' } } }, { NOT: notApplicable }] });
  if (dto.cancelledBy) conditions.push({ status: 'cancelled', ...(dto.cancelledBy === 'unknown' ? { cancelledBy: null, OR: [{ session: null }, { session: { endedBy: null } }] } : { OR: [{ cancelledBy: dto.cancelledBy }, { cancelledBy: null, session: { endedBy: dto.cancelledBy } }] }) });
  if (dto.refundStatus) conditions.push(dto.refundStatus === 'needs_review' ? { OR: [{ payment: { refundStatus: 'needs_review' } }, { status: 'refunded', OR: [{ payment: null }, { payment: { refundStatus: null } }] }] } : { payment: { refundStatus: dto.refundStatus as any } });
  if (dto.reportStage) conditions.push(dto.reportStage === 'missing' ? { status: 'completed', report: null } : { report: { status: dto.reportStage as any } });
  const state = dto.paymentState;
  if (state === 'test') conditions.push(test);
  else if (state === 'free') conditions.push({ amount: 0, payment: null, NOT: test });
  else if (state === 'not_recorded') conditions.push({ amount: { gt: 0 }, payment: null, status: { not: 'pending_payment' }, NOT: test });
  else if (state === 'pending') conditions.push({ AND: [{ NOT: test }, { OR: [{ payment: { status: 'created' } }, { payment: null, status: 'pending_payment' }] }] });
  else if (state === 'failed') conditions.push({ payment: { status: 'failed' }, NOT: test });
  else if (state === 'paid') conditions.push({ payment: { status: 'paid', refundStatus: null }, NOT: test });
  else if (state === 'refund_pending') conditions.push({ payment: { refundStatus: { in: ['requested', 'processing', 'needs_review', 'failed'] } }, NOT: test });
  // Field-to-field refund comparisons are supplied as matching IDs by the service.
  else if (state === 'refunded' || state === 'partially_refunded') conditions.push({ id: { in: ids.refunds ?? [] }, NOT: test });
  const term = dto.search?.trim();
  if (term) {
    const lawyerNumber = /^LAW[-\s]*0*(\d+)$/i.exec(term);
    const n = /^(?:AML[-\s]*)?(\d+)$/i.exec(term);
    conditions.push({ OR: [
      { customer: { fullName: { contains: term, mode: 'insensitive' } } },
      { customer: { phone: { contains: term } } }, { customer: { email: { contains: term, mode: 'insensitive' } } },
      { lawyer: { fullName: { contains: term, mode: 'insensitive' } } }, { lawyer: { phone: { contains: term } } },
      ...(lawyerNumber && Number(lawyerNumber[1]) <= 2147483647 ? [{ lawyer: { lawyerNumber: Number(lawyerNumber[1]) } }] : []),
      { category: { contains: term, mode: 'insensitive' } },
      ...(n && Number(n[1]) <= 2147483647 ? [{ number: Number(n[1]) }] : []),
      ...((ids.search?.length ?? 0) ? [{ id: { in: ids.search } }] : []),
    ] });
  }
  if (dto.from || dto.to) {
    function boundary(day: string, end = false) {
      const instant = new Date(`${day}T00:00:00+05:30`);
      if (!Number.isFinite(instant.getTime()) || new Date(instant.getTime() + 19800000).toISOString().slice(0, 10) !== day) throw new AppException(HttpStatus.BAD_REQUEST, 'INVALID_DATE', 'Choose a valid calendar date.');
      return new Date(instant.getTime() + (end ? 86400000 : 0));
    }
    if (dto.from && dto.to && dto.from > dto.to) throw new AppException(HttpStatus.BAD_REQUEST, 'INVALID_DATE_RANGE', 'End date must follow the start date.');
    const range = { ...(dto.from ? { gte: boundary(dto.from) } : {}), ...(dto.to ? { lt: boundary(dto.to, true) } : {}) };
    conditions.push(dto.dateField === 'refundRequestedAt' ? { payment: { refundRequestedAt: range } } : dto.dateField === 'refundedAt' ? { payment: { refundedAt: range, refundStatus: 'completed' } } : dto.dateField === 'endedAt' ? { session: { endedAt: range } } : dto.dateField === 'startedAt' ? { session: { startedAt: range } } : dto.dateField === 'submittedAt' ? { report: { submittedAt: range } } : dto.dateField === 'scheduledFor' ? { scheduledFor: range } : { createdAt: range });
  }
  return { AND: conditions };
}
