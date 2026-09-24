import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PushService } from '../../infrastructure/push/push.service';
import { normalisePermissions } from '../admin-users/permission-catalogue';
import { AdminEventsService } from './admin-events.service';

interface NewAlert {
  /** The permission module it belongs to, e.g. "lawyers". */
  module: string;
  title: string;
  body: string;
  /** Where clicking it goes in the panel. */
  link?: string;
}

/** The bell in the admin panel: what needs someone's attention. */
@Injectable()
export class AdminAlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: AdminEventsService,
    private readonly push: PushService,
  ) {}

  /**
   * Files an alert for everyone who can act on it — the Super Admin, and
   * anyone granted that module — then nudges their open panels.
   */
  async notify(alert: NewAlert) {
    const admins = await this.prisma.adminUser.findMany({
      where: { status: 'active', deletedAt: null },
      select: { id: true, permissions: true, role: { select: { isSystem: true } } },
    });

    const recipients = admins
      .filter(
        (admin) =>
          admin.role.isSystem ||
          normalisePermissions(admin.permissions)[alert.module] !== 'none',
      )
      .map((admin) => admin.id);

    if (recipients.length === 0) return { recipients: 0 };

    await this.prisma.adminAlert.createMany({
      data: recipients.map((adminUserId) => ({ adminUserId, ...alert })),
    });

    // Open panels hear it at once; browsers that are closed get a push.
    this.events.publishMany(recipients, 'alert');
    await this.pushToBrowsers(recipients, alert);

    return { recipients: recipients.length };
  }

  /** The same, addressed to one person rather than everyone who can act. */
  async notifyOne(adminUserId: string, alert: NewAlert) {
    await this.prisma.adminAlert.create({ data: { adminUserId, ...alert } });
    this.events.publish(adminUserId, 'alert');
    await this.pushToBrowsers([adminUserId], alert);

    return { recipients: 1 };
  }

  /** Clears one notification, the chosen ones, or the lot. */
  async remove(adminUserId: string, ids?: string[]) {
    await this.prisma.adminAlert.deleteMany({
      where: { adminUserId, ...(ids?.length ? { id: { in: ids } } : {}) },
    });

    return this.countAndAnnounce(adminUserId);
  }

  /** Registers the browser this admin is signed in on. */
  async registerBrowser(adminUserId: string, token: string, userAgent?: string) {
    await this.prisma.adminPushToken.upsert({
      where: { token },
      create: { adminUserId, token, userAgent: userAgent?.slice(0, 300) },
      update: { adminUserId, lastSeenAt: new Date() },
    });

    return { registered: true };
  }

  async unregisterBrowser(adminUserId: string, token: string) {
    await this.prisma.adminPushToken.deleteMany({ where: { token, adminUserId } });
    return { registered: false };
  }

  /** Desktop notifications, for whoever is not looking at the panel. */
  private async pushToBrowsers(adminUserIds: string[], alert: NewAlert) {
    const browsers = await this.prisma.adminPushToken.findMany({
      where: { adminUserId: { in: adminUserIds } },
      select: { token: true },
    });
    if (browsers.length === 0) return;

    const result = await this.push.send(
      browsers.map((browser) => browser.token),
      {
        title: alert.title,
        body: alert.body,
        data: { link: alert.link ?? '/notifications/alerts' },
      },
    );

    if (result.staleTokens.length > 0) {
      await this.prisma.adminPushToken.deleteMany({
        where: { token: { in: result.staleTokens } },
      });
    }
  }

  /** The bell's dropdown: the newest unread, plus the total. */
  async unread(adminUserId: string, take = 5) {
    const [rows, unread] = await this.prisma.$transaction([
      this.prisma.adminAlert.findMany({
        where: { adminUserId, readAt: null },
        orderBy: { createdAt: 'desc' },
        take,
      }),
      this.prisma.adminAlert.count({ where: { adminUserId, readAt: null } }),
    ]);

    return { data: rows.map(toAlert), unread };
  }

  /** The full list behind "View all". */
  async list(adminUserId: string) {
    const [rows, unread] = await this.prisma.$transaction([
      this.prisma.adminAlert.findMany({
        where: { adminUserId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.adminAlert.count({ where: { adminUserId, readAt: null } }),
    ]);

    return { data: rows.map(toAlert), unread };
  }

  /** Marks one alert read, or all of them when no id is given. */
  async markRead(adminUserId: string, id?: string) {
    await this.prisma.adminAlert.updateMany({
      where: { adminUserId, readAt: null, ...(id ? { id } : {}) },
      data: { readAt: new Date() },
    });

    return this.countAndAnnounce(adminUserId);
  }

  /**
   * The new count, announced on the stream so the bell follows along — in
   * this tab and in any other the admin has open.
   */
  private async countAndAnnounce(adminUserId: string) {
    const unread = await this.prisma.adminAlert.count({
      where: { adminUserId, readAt: null },
    });

    this.events.publish(adminUserId, 'alert');
    return { unread };
  }
}

function toAlert(row: {
  id: string;
  title: string;
  body: string;
  module: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    module: row.module,
    link: row.link,
    read: row.readAt !== null,
    createdAt: row.createdAt,
  };
}
