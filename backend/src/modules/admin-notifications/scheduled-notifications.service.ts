import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationAudience, Prisma, ScheduledStatus } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AdminNotificationsService } from './admin-notifications.service';
import { ListScheduledDto, ScheduleNotificationDto } from './dto/scheduled.dto';

const AUDIENCE_LABEL: Record<NotificationAudience, string> = {
  all_lawyers: 'All lawyers',
  all_customers: 'All customers',
  lawyer: 'Lawyer',
  customer: 'Customer',
};

const isBroadcast = (audience: NotificationAudience) =>
  audience === 'all_lawyers' || audience === 'all_customers';

const notFound = () =>
  new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Scheduled notification not found.');

const alreadyDone = (status: ScheduledStatus) =>
  new AppException(
    HttpStatus.CONFLICT,
    'ALREADY_DECIDED',
    `This broadcast was already ${status}.`,
  );

/** Notifications queued for later, and the worker that sends them. */
@Injectable()
export class ScheduledNotificationsService {
  private readonly logger = new Logger(ScheduledNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: AdminNotificationsService,
  ) {}

  async list({ status }: ListScheduledDto) {
    const rows = await this.prisma.scheduledNotification.findMany({
      where: status ? { status } : {},
      orderBy: { scheduledFor: 'asc' },
      select: scheduledSelect,
    });

    return { data: rows.map(toScheduled), meta: { total: rows.length } };
  }

  async get(id: string) {
    const row = await this.prisma.scheduledNotification.findUnique({
      where: { id },
      select: scheduledSelect,
    });
    if (!row) throw notFound();

    return toScheduled(row);
  }

  async create(adminId: string, dto: ScheduleNotificationDto) {
    const { when, targetUserId } = await this.check(dto);

    const row = await this.prisma.scheduledNotification.create({
      data: {
        title: dto.title,
        body: dto.body,
        audience: dto.audience,
        targetUserId,
        scheduledFor: when,
        createdById: adminId,
      },
      select: scheduledSelect,
    });

    return toScheduled(row);
  }

  /** Only something still waiting can be changed. */
  async update(id: string, dto: ScheduleNotificationDto) {
    const existing = await this.prisma.scheduledNotification.findUnique({ where: { id } });
    if (!existing) throw notFound();
    if (existing.status !== ScheduledStatus.scheduled) throw alreadyDone(existing.status);

    const { when, targetUserId } = await this.check(dto);

    const row = await this.prisma.scheduledNotification.update({
      where: { id },
      data: {
        title: dto.title,
        body: dto.body,
        audience: dto.audience,
        targetUserId,
        scheduledFor: when,
      },
      select: scheduledSelect,
    });

    return toScheduled(row);
  }

  async cancel(id: string) {
    const existing = await this.prisma.scheduledNotification.findUnique({ where: { id } });
    if (!existing) throw notFound();
    if (existing.status !== ScheduledStatus.scheduled) throw alreadyDone(existing.status);

    const row = await this.prisma.scheduledNotification.update({
      where: { id },
      data: { status: ScheduledStatus.cancelled },
      select: scheduledSelect,
    });

    return toScheduled(row);
  }

  /**
   * Sends anything whose time has come. Runs every minute; a broadcast is
   * claimed with a guarded update first, so two workers — or two servers —
   * can never send the same one twice.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async runDue() {
    const due = await this.prisma.scheduledNotification.findMany({
      where: { status: ScheduledStatus.scheduled, scheduledFor: { lte: new Date() } },
      orderBy: { scheduledFor: 'asc' },
      take: 20,
    });

    for (const broadcast of due) {
      const claimed = await this.prisma.scheduledNotification.updateMany({
        where: { id: broadcast.id, status: ScheduledStatus.scheduled },
        data: { status: ScheduledStatus.sent, sentAt: new Date() },
      });
      if (claimed.count === 0) continue;

      try {
        const result = await this.notifications.deliver(broadcast.createdById, {
          title: broadcast.title,
          body: broadcast.body,
          audience: broadcast.audience,
          userId: broadcast.targetUserId ?? undefined,
        });

        await this.prisma.scheduledNotification.update({
          where: { id: broadcast.id },
          data: {
            recipients: result.recipients,
            delivered: result.delivered,
            failed: result.failed,
          },
        });
        this.logger.log(`Sent scheduled "${broadcast.title}" to ${result.recipients} device(s)`);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Could not be sent.';
        await this.prisma.scheduledNotification.update({
          where: { id: broadcast.id },
          data: { status: ScheduledStatus.failed, error: reason.slice(0, 500) },
        });
        this.logger.error(`Scheduled "${broadcast.title}" failed: ${reason}`);
      }
    }
  }

  /** Shared checks: a real recipient, and a time still in the future. */
  private async check(dto: ScheduleNotificationDto) {
    const when = new Date(dto.scheduledFor);
    if (Number.isNaN(when.getTime())) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'BAD_TIME', 'Choose when this should be sent.');
    }
    if (when.getTime() < Date.now() - 60_000) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'TIME_IN_PAST',
        'Pick a time in the future.',
      );
    }

    if (isBroadcast(dto.audience)) return { when, targetUserId: null };

    if (!dto.userId) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'RECIPIENT_REQUIRED',
        'Choose who this notification goes to.',
      );
    }

    const role = dto.audience === 'lawyer' ? 'lawyer' : 'customer';
    const target = await this.prisma.user.findFirst({
      where: { id: dto.userId, role, deletedAt: null },
      select: { id: true },
    });
    if (!target) {
      throw new AppException(HttpStatus.NOT_FOUND, 'RECIPIENT_NOT_FOUND', 'Recipient not found.');
    }

    return { when, targetUserId: target.id };
  }
}

const scheduledSelect = {
  id: true,
  title: true,
  body: true,
  audience: true,
  targetUserId: true,
  scheduledFor: true,
  status: true,
  sentAt: true,
  recipients: true,
  delivered: true,
  failed: true,
  error: true,
  target: { select: { fullName: true, phone: true } },
  createdBy: { select: { name: true } },
} satisfies Prisma.ScheduledNotificationSelect;

type ScheduledRow = Prisma.ScheduledNotificationGetPayload<{ select: typeof scheduledSelect }>;

/** The shape the admin panel renders. */
function toScheduled(row: ScheduledRow) {
  const person = row.target?.fullName || row.target?.phone || null;

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    audienceLabel: person
      ? `${AUDIENCE_LABEL[row.audience]} — ${person}`
      : AUDIENCE_LABEL[row.audience],
    userId: row.targetUserId,
    scheduledFor: row.scheduledFor,
    status: row.status,
    sentAt: row.sentAt,
    recipients: row.recipients,
    delivered: row.delivered,
    failed: row.failed,
    error: row.error,
    createdBy: row.createdBy?.name ?? null,
  };
}
