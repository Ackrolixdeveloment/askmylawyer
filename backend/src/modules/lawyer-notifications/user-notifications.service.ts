import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PushService } from '../../infrastructure/push/push.service';

/** What the app shows behind the bell icon. */
@Injectable()
export class UserNotificationsService {
  private readonly logger = new Logger(UserNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /**
   * Records something worth telling someone about.
   *
   * [type] is what the app filters on — "consultation", "report",
   * "payment" — so the tabs on the notification screen have something to
   * sort by.
   */
  async notify(
    userId: string,
    title: string,
    body: string,
    type = 'consultation',
  ) {
    const row = await this.prisma.userNotification.create({
      data: { userId, title, body, type },
    });

    // The row is the record; the push is the nudge. Someone whose phone
    // cannot be reached still finds it behind the bell, so a failed push is
    // never allowed to fail whatever caused it.
    await this.pushToPhones(userId, row.id, title, body, type).catch(
      (error: unknown) =>
        this.logger.error({ err: error }, `Could not push to ${userId}`),
    );
  }

  /** Sends the same wording to every phone this person is signed in on. */
  private async pushToPhones(
    userId: string,
    id: string,
    title: string,
    body: string,
    type: string,
  ) {
    const devices = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });
    if (devices.length === 0) return;

    const result = await this.push.send(
      devices.map((device) => device.token),
      { title, body, data: { type, notificationId: id } },
    );

    // A token the phone has replaced only wastes a request next time.
    if (result.staleTokens.length > 0) {
      await this.prisma.deviceToken.deleteMany({
        where: { token: { in: result.staleTokens } },
      });
    }
  }

  /**
   * The list, or — with `after` — only what has arrived since. The app polls
   * that way while it is open, so a notification still shows up as a banner
   * on a device push never reached.
   */
  async list(userId: string, after?: Date) {
    const [rows, unread] = await this.prisma.$transaction([
      this.prisma.userNotification.findMany({
        where: { userId, ...(after ? { createdAt: { gt: after } } : {}) },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.userNotification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        type: row.type,
        read: row.readAt !== null,
        createdAt: row.createdAt,
      })),
      unread,
    };
  }

  /** Just the badge, for the home screen. */
  async unreadCount(userId: string) {
    return { unread: await this.prisma.userNotification.count({ where: { userId, readAt: null } }) };
  }

  /** Marks one notification read, or all of them when no id is given. */
  async markRead(userId: string, id?: string) {
    await this.prisma.userNotification.updateMany({
      where: { userId, readAt: null, ...(id ? { id } : {}) },
      data: { readAt: new Date() },
    });

    return this.unreadCount(userId);
  }
}
