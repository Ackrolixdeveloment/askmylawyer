import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/** What the app shows behind the bell icon. */
@Injectable()
export class UserNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

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
