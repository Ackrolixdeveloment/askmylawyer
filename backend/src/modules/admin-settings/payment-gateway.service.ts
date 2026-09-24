import { HttpStatus, Injectable } from '@nestjs/common';
import { GatewayEnvironment } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { decryptField, encryptField } from '../../common/field-encryption';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { SaveGatewayDto } from './dto/gateway.dto';

/** The settings row is a singleton; this is its id. */
const SETTINGS_ID = 1;

const ENVIRONMENTS: GatewayEnvironment[] = [
  GatewayEnvironment.sandbox,
  GatewayEnvironment.production,
];

/**
 * Cashfree credentials, kept per environment so the test and live keys can
 * both be stored and switched between.
 *
 * Secrets are encrypted at rest and never sent to the browser — the panel
 * sees only the last four characters, enough to recognise a key without
 * being able to use it.
 */
@Injectable()
export class PaymentGatewayService {
  constructor(private readonly prisma: PrismaService) {}

  /** What the Integrations screen shows. */
  async get() {
    const [rows, settings] = await Promise.all([
      this.prisma.paymentGateway.findMany(),
      this.settings(),
    ]);

    const byEnvironment = Object.fromEntries(
      ENVIRONMENTS.map((environment) => {
        const row = rows.find((entry) => entry.environment === environment);

        return [
          environment,
          {
            appId: row?.appId ?? '',
            /** "••••1234", or empty when nothing is stored yet. */
            secretKeyMasked: mask(row?.secretKeyLast4),
            webhookSecretMasked: mask(row?.webhookLast4),
            /** Whether this environment is ready to take payments. */
            configured: Boolean(row?.appId && row?.secretKeyEnc && row?.webhookSecretEnc),
            updatedAt: row?.updatedAt ?? null,
          },
        ];
      }),
    );

    return { environment: settings.gateway, ...byEnvironment };
  }

  /**
   * Saves one environment's keys and makes it the one the apps charge
   * through. A blank secret keeps whatever is already stored, so the form
   * never has to show a key to save the App ID beside it.
   */
  async save(dto: SaveGatewayDto) {
    const existing = await this.prisma.paymentGateway.findUnique({
      where: { environment: dto.environment },
    });

    const secret = dto.secretKey
      ? { secretKeyEnc: encryptField(dto.secretKey), secretKeyLast4: last4(dto.secretKey) }
      : {};
    const webhook = dto.webhookSecret
      ? {
          webhookSecretEnc: encryptField(dto.webhookSecret),
          webhookLast4: last4(dto.webhookSecret),
        }
      : {};

    const willHaveSecret = Boolean(dto.secretKey || existing?.secretKeyEnc);
    const willHaveWebhook = Boolean(dto.webhookSecret || existing?.webhookSecretEnc);

    // Going live with half a key set would only fail at checkout.
    if (dto.environment === GatewayEnvironment.production && (!willHaveSecret || !willHaveWebhook)) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'GATEWAY_INCOMPLETE',
        'Production needs the App ID, the secret key and the webhook secret.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.paymentGateway.upsert({
        where: { environment: dto.environment },
        create: { environment: dto.environment, appId: dto.appId, ...secret, ...webhook },
        update: { appId: dto.appId, ...secret, ...webhook },
      }),
      this.prisma.platformSettings.upsert({
        where: { id: SETTINGS_ID },
        create: { id: SETTINGS_ID, gateway: dto.environment },
        update: { gateway: dto.environment },
      }),
    ]);

    return this.get();
  }

  /**
   * The keys the apps should actually charge with. Server-side only — this
   * is the one place the secrets are decrypted, for the payment flow to use
   * when it is built.
   */
  async activeCredentials() {
    const settings = await this.settings();
    const row = await this.prisma.paymentGateway.findUnique({
      where: { environment: settings.gateway },
    });

    if (!row?.appId || !row.secretKeyEnc || !row.webhookSecretEnc) {
      throw new AppException(
        HttpStatus.SERVICE_UNAVAILABLE,
        'GATEWAY_NOT_CONFIGURED',
        'Payments are not set up yet.',
      );
    }

    return {
      environment: settings.gateway,
      appId: row.appId,
      secretKey: decryptField(row.secretKeyEnc),
      webhookSecret: decryptField(row.webhookSecretEnc),
    };
  }

  private settings() {
    return this.prisma.platformSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
    });
  }
}

const last4 = (value: string) => value.slice(-4);

const mask = (tail: string | null | undefined) => (tail ? `••••••${tail}` : '');
