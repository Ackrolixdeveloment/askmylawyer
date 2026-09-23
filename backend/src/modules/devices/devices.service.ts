import { Injectable } from '@nestjs/common';
import { DevicePlatform } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/** The phones a person is signed in on, so push can reach them. */
@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * One row per install. If the same phone is handed to another account the
   * token moves across, so nobody receives someone else's notifications.
   */
  async register(userId: string, token: string, platform: DevicePlatform) {
    await this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform, lastSeenAt: new Date() },
    });

    return { registered: true };
  }

  async unregister(userId: string, token: string) {
    await this.prisma.deviceToken.deleteMany({ where: { token, userId } });
    return { registered: false };
  }
}
