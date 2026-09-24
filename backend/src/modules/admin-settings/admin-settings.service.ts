import { HttpStatus, Injectable } from '@nestjs/common';
import { CommissionMode } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PlanDto, SavePlansDto } from './dto/plan.dto';

/** The settings row is a singleton; this is its id. */
const SETTINGS_ID = 1;

/**
 * Consultation plans and the rates that apply to them.
 *
 * The admin team prices chat, audio and video here; the lawyer app reads it
 * to know what a lawyer may accept, and the customer app to know what can be
 * booked and what it costs.
 */
@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Everything the settings screen needs in one call. */
  async plans() {
    const [plans, settings] = await Promise.all([
      this.prisma.servicePlan.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.settings(),
    ]);

    return {
      plans: plans.map(toPlan),
      gstPercent: settings.gstPercent,
      tdsPercent: settings.tdsPercent,
    };
  }

  /** What the apps may offer: enabled plans only, priced as the customer pays. */
  async publicPlans() {
    const [plans, settings] = await Promise.all([
      this.prisma.servicePlan.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.settings(),
    ]);

    return {
      data: plans.map((plan) => {
        const gst = Math.round((plan.amount * settings.gstPercent) / 100);

        return {
          code: plan.code,
          type: plan.type,
          amount: plan.amount,
          gst,
          /** What the customer is actually billed. */
          payable: plan.amount + gst,
          durationMinutes: plan.durationMinutes,
          extensionMinutes: plan.extensionMinutes,
          extensionAmount: plan.extensionAmount,
        };
      }),
    };
  }

  /** The screen saves every plan at once; each row is matched on its code. */
  async savePlans(dto: SavePlansDto) {
    for (const plan of dto.plans) assertCommissionFits(plan);

    const codes = dto.plans.map((plan) => plan.code);
    if (new Set(codes).size !== codes.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'DUPLICATE_PLAN',
        'Two plans cannot share the same code.',
      );
    }

    await this.prisma.$transaction(
      dto.plans.map((plan, index) =>
        this.prisma.servicePlan.upsert({
          where: { code: plan.code },
          create: { ...plan, sortOrder: index },
          update: { ...plan, sortOrder: index },
        }),
      ),
    );

    return this.plans();
  }

  /** Reads the single settings row, creating it the first time. */
  private async settings() {
    return this.prisma.platformSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
    });
  }
}

/**
 * Commission comes out of the consultation charge alone, so a flat fee
 * larger than that charge would owe the lawyer nothing.
 */
function assertCommissionFits(plan: PlanDto) {
  const tooLarge =
    plan.commissionMode === CommissionMode.percent
      ? plan.commissionValue > 100
      : plan.commissionValue > plan.amount;

  if (tooLarge) {
    throw new AppException(
      HttpStatus.BAD_REQUEST,
      'COMMISSION_TOO_LARGE',
      plan.commissionMode === CommissionMode.percent
        ? `${plan.type}: commission cannot be more than 100%.`
        : `${plan.type}: a flat commission cannot be more than the ₹${plan.amount} charge.`,
    );
  }
}

function toPlan(row: {
  code: string;
  type: string;
  amount: number;
  commissionMode: CommissionMode;
  commissionValue: number;
  durationMinutes: number;
  extensionMinutes: number;
  extensionAmount: number;
  enabled: boolean;
}) {
  return {
    // The screen keys its rows on this.
    id: row.code,
    code: row.code,
    type: row.type,
    amount: row.amount,
    commissionMode: row.commissionMode,
    commissionValue: row.commissionValue,
    durationMinutes: row.durationMinutes,
    extensionMinutes: row.extensionMinutes,
    extensionAmount: row.extensionAmount,
    enabled: row.enabled,
  };
}
