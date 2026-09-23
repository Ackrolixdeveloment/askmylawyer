import { HttpStatus, Injectable } from '@nestjs/common';
import { AppRole, NotificationAudience, Prisma } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PushService } from '../../infrastructure/push/push.service';
import {
  ListNotificationsDto,
  SearchRecipientsDto,
  SendNotificationDto,
} from './dto/notification.dto';

/** Which app each audience belongs to. */
const AUDIENCE_ROLE: Record<NotificationAudience, AppRole> = {
  all_lawyers: 'lawyer',
  lawyer: 'lawyer',
  all_customers: 'customer',
  customer: 'customer',
};

const AUDIENCE_LABEL: Record<NotificationAudience, string> = {
  all_lawyers: 'All lawyers',
  all_customers: 'All customers',
  lawyer: 'Lawyer',
  customer: 'Customer',
};

const isBroadcast = (audience: NotificationAudience) =>
  audience === 'all_lawyers' || audience === 'all_customers';

/** Broadcasts and one-to-one notifications sent from the admin panel. */
@Injectable()
export class AdminNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /** How many people and phones each audience covers right now. */
  async audience() {
    const [lawyers, customers, lawyerDevices, customerDevices] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: 'lawyer', status: 'active', deletedAt: null } }),
      this.prisma.user.count({ where: { role: 'customer', status: 'active', deletedAt: null } }),
      this.prisma.deviceToken.count({ where: { user: { role: 'lawyer', deletedAt: null } } }),
      this.prisma.deviceToken.count({ where: { user: { role: 'customer', deletedAt: null } } }),
    ]);

    return {
      lawyers: { people: lawyers, devices: lawyerDevices },
      customers: { people: customers, devices: customerDevices },
      /** False until the Firebase service account is configured. */
      pushConfigured: this.push.configured,
    };
  }

  /** Type-ahead for "send to one person". */
  async recipients({ role, q }: SearchRecipientsDto) {
    const needle = q?.trim();
    const where: Prisma.UserWhereInput = {
      role,
      deletedAt: null,
      ...(needle
        ? {
            OR: [
              { fullName: { contains: needle, mode: 'insensitive' } },
              { email: { contains: needle, mode: 'insensitive' } },
              { phone: { contains: needle } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        _count: { select: { deviceTokens: true } },
      },
      orderBy: { fullName: 'asc' },
      take: 20,
    });

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.fullName ?? '',
        email: row.email ?? '',
        mobile: row.phone ?? '',
        devices: row._count.deviceTokens,
      })),
    };
  }

  /** Sends now and records what went out. */
  async send(adminId: string, dto: SendNotificationDto) {
    const role = AUDIENCE_ROLE[dto.audience];
    let target: { id: string; fullName: string | null } | null = null;

    if (!isBroadcast(dto.audience)) {
      if (!dto.userId) {
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          'RECIPIENT_REQUIRED',
          `Choose which ${role} this notification goes to.`,
        );
      }

      target = await this.prisma.user.findFirst({
        where: { id: dto.userId, role, deletedAt: null },
        select: { id: true, fullName: true },
      });
      if (!target) {
        throw new AppException(HttpStatus.NOT_FOUND, 'RECIPIENT_NOT_FOUND', 'Recipient not found.');
      }
    }

    const people = target
      ? [{ id: target.id }]
      : await this.prisma.user.findMany({
          where: { role, status: 'active', deletedAt: null },
          select: { id: true },
        });

    const devices = await this.prisma.deviceToken.findMany({
      where: { userId: { in: people.map((person) => person.id) } },
      select: { token: true },
    });
    const tokens = devices.map((device) => device.token);

    // The app's bell shows these whether or not a push got through.
    await this.prisma.userNotification.createMany({
      data: people.map((person) => ({
        userId: person.id,
        title: dto.title,
        body: dto.body,
        type: 'admin_notification',
      })),
    });

    const result = await this.push.send(tokens, {
      title: dto.title,
      body: dto.body,
      data: { type: 'admin_notification' },
    });

    // Tokens FCM has given up on are no use to anyone.
    if (result.staleTokens.length > 0) {
      await this.prisma.deviceToken.deleteMany({
        where: { token: { in: result.staleTokens } },
      });
    }

    const row = await this.prisma.adminNotification.create({
      data: {
        title: dto.title,
        body: dto.body,
        audience: dto.audience,
        targetUserId: target?.id ?? null,
        recipients: tokens.length,
        delivered: result.delivered,
        failed: result.failed,
        sentById: adminId,
      },
      select: notificationSelect,
    });

    return { ...toNotification(row), simulated: result.simulated };
  }

  /** What has been sent, newest first. */
  async list({ page, limit }: ListNotificationsDto) {
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.adminNotification.count(),
      this.prisma.adminNotification.findMany({
        select: notificationSelect,
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { data: rows.map(toNotification), meta: { page, limit, total } };
  }
}

const notificationSelect = {
  id: true,
  title: true,
  body: true,
  audience: true,
  recipients: true,
  delivered: true,
  failed: true,
  sentAt: true,
  target: { select: { fullName: true, phone: true } },
  sentBy: { select: { name: true } },
} satisfies Prisma.AdminNotificationSelect;

type NotificationRow = Prisma.AdminNotificationGetPayload<{ select: typeof notificationSelect }>;

/** The shape the admin panel renders. */
function toNotification(row: NotificationRow) {
  const person = row.target?.fullName || row.target?.phone || null;

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    audienceLabel: person
      ? `${AUDIENCE_LABEL[row.audience]} — ${person}`
      : AUDIENCE_LABEL[row.audience],
    recipients: row.recipients,
    delivered: row.delivered,
    failed: row.failed,
    sentAt: row.sentAt,
    sentBy: row.sentBy?.name ?? null,
  };
}
