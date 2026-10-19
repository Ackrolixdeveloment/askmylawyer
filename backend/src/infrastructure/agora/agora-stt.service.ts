import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../config/env';
import { transcriptPrefix } from './transcript-path';

/** Agora's bot needs two uids of its own; neither side's, and different. */
const SUBSCRIBER_UID = '1001';
const PUBLISHER_UID = '1002';

/** vendor 1 is Amazon S3 in Agora's storage config. */
const VENDOR_S3 = 1;

/**
 * Agora numbers S3 regions rather than naming them, and writes to the wrong
 * one rather than complaining, so the bucket's region is translated here
 * instead of being hard-coded.
 */
const S3_REGIONS: Record<string, number> = {
  'us-east-1': 0,
  'us-east-2': 1,
  'us-west-1': 2,
  'us-west-2': 3,
  'eu-west-1': 4,
  'eu-west-2': 5,
  'eu-west-3': 6,
  'eu-central-1': 7,
  'ap-southeast-1': 8,
  'ap-southeast-2': 9,
  'ap-northeast-1': 10,
  'ap-northeast-2': 11,
  'sa-east-1': 12,
  'ca-central-1': 13,
  'ap-south-1': 14,
};

/**
 * What the bot listens for. Hindi and English cover the Hinglish case
 * between them — Agora picks per utterance, which is what a conversation
 * that switches mid-sentence needs.
 */
const LANGUAGES = ['en-IN', 'hi-IN'];

/**
 * Agora's own ceiling on how long the bot sits in a silent channel. The
 * call's paid window is shorter, and the sweep that ends a call takes the
 * bot out, so this is only a backstop against a bot nobody shut down.
 */
const MAX_IDLE_SECONDS = 60;

const BASE = 'https://api.agora.io';

export interface SttTask {
  agentId: string;
}

/**
 * Starts and stops Agora's transcription bot on a live call.
 *
 * The bot joins the channel like a third participant, listens, and writes a
 * `.vtt` subtitle file to our S3 bucket when it leaves. Nothing here is on
 * the critical path of a call: every method reports failure by returning
 * null, because a consultation that cannot be transcribed is still a
 * consultation, and the lawyer writes the report by hand instead.
 *
 * This speaks Agora's **v7** API. The v6 one took a "builder token" from a
 * separate `acquire` call and passed it in the query string; v7 removed
 * that step and authenticates each request on its own, so there is no token
 * to fetch, carry or store.
 */
@Injectable()
export class AgoraSttService {
  private readonly logger = new Logger(AgoraSttService.name);

  get configured() {
    return Boolean(
      env.AGORA_APP_ID &&
        env.AGORA_CUSTOMER_ID &&
        env.AGORA_CUSTOMER_SECRET &&
        env.TRANSCRIPT_BUCKET &&
        env.TRANSCRIPT_AWS_ACCESS_KEY_ID &&
        env.TRANSCRIPT_AWS_SECRET_ACCESS_KEY,
    );
  }

  /** Where this consultation's transcript is written, as path segments. */
  prefixFor(requestId: string) {
    return transcriptPrefix(requestId);
  }

  /**
   * Puts a transcription bot in the channel. Returns what is needed to stop
   * it again, or null when transcription is off or Agora refused.
   */
  async start(channel: string, requestId: string): Promise<SttTask | null> {
    if (!this.configured) {
      this.logger.warn('Speech-to-text is not configured; this call will not be transcribed.');
      return null;
    }

    const region = S3_REGIONS[env.TRANSCRIPT_BUCKET_REGION];
    if (region === undefined) {
      // Sending the wrong number here loses the transcript silently, which
      // is worse than not starting.
      this.logger.error(
        `No Agora region code for ${env.TRANSCRIPT_BUCKET_REGION}; this call will not be transcribed.`,
      );
      return null;
    }

    const started = await this.call<{ agent_id?: string; status?: string }>(
      `/api/speech-to-text/v1/projects/${env.AGORA_APP_ID}/join`,
      {
        // Required in v7, and it has to be unique while the agent runs.
        name: `aml-${requestId}`,
        languages: LANGUAGES,
        maxIdleTime: MAX_IDLE_SECONDS,
        rtcConfig: {
          channelName: channel,
          // The bot subscribes on one uid and publishes captions on
          // another; Agora rejects them being the same.
          subBotUid: SUBSCRIBER_UID,
          pubBotUid: PUBLISHER_UID,
        },
        captionConfig: {
          storage: {
            vendor: VENDOR_S3,
            region,
            bucket: env.TRANSCRIPT_BUCKET,
            accessKey: env.TRANSCRIPT_AWS_ACCESS_KEY_ID,
            secretKey: env.TRANSCRIPT_AWS_SECRET_ACCESS_KEY,
            fileNamePrefix: this.prefixFor(requestId),
          },
        },
      },
    );

    const agentId = started?.agent_id;
    if (!agentId) return null;

    this.logger.log(`Transcribing ${channel} as agent ${agentId} (${started.status ?? 'started'}).`);
    return { agentId };
  }

  /**
   * Takes the bot back out. Agora writes the file on its way out, so a call
   * that is never stopped is a call with no transcript — and one that keeps
   * billing.
   */
  async stop(task: SttTask) {
    const left = await this.call(
      `/api/speech-to-text/v1/projects/${env.AGORA_APP_ID}/agents/${task.agentId}/leave`,
      {},
    );

    if (left === null) return false;
    this.logger.log(`Transcription agent ${task.agentId} has left.`);
    return true;
  }

  /**
   * One request to Agora's REST API. Returns null on anything that is not a
   * success, having logged it — callers carry on without transcription
   * rather than failing the call.
   */
  private async call<T>(path: string, body: unknown): Promise<T | null> {
    const auth = Buffer.from(`${env.AGORA_CUSTOMER_ID}:${env.AGORA_CUSTOMER_SECRET}`).toString(
      'base64',
    );

    try {
      const response = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });

      const text = await response.text();
      if (!response.ok) {
        this.logger.error(`Agora POST ${path} returned ${response.status}: ${text}`);
        return null;
      }

      return (text ? JSON.parse(text) : {}) as T;
    } catch (error) {
      this.logger.error({ err: error }, `Agora POST ${path} failed.`);
      return null;
    }
  }
}
