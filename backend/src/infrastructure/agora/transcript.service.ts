import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../config/env';

/** The uids the two people in a call join with. */
const CUSTOMER_UID = '1';
const LAWYER_UID = '2';

/** `00:01:23.456 --> 00:01:25.000`, the line between a cue and its words. */
const TIMING = /-->/;

/** `<v 2>…</v>`, where the number is the uid that spoke. */
const VOICE = /^<v\s+([^>]+)>(.*?)(?:<\/v>)?$/s;

/**
 * Reads back what Agora transcribed.
 *
 * The bot writes a WebVTT subtitle file to our bucket on its way out of the
 * channel, so this is a poll rather than a callback: the file simply appears
 * some seconds after the call ends, or it does not.
 */
@Injectable()
export class TranscriptService {
  private readonly logger = new Logger(TranscriptService.name);

  private readonly s3 =
    env.TRANSCRIPT_BUCKET &&
    env.TRANSCRIPT_AWS_ACCESS_KEY_ID &&
    env.TRANSCRIPT_AWS_SECRET_ACCESS_KEY
      ? new S3Client({
          region: env.TRANSCRIPT_BUCKET_REGION,
          credentials: {
            accessKeyId: env.TRANSCRIPT_AWS_ACCESS_KEY_ID,
            secretAccessKey: env.TRANSCRIPT_AWS_SECRET_ACCESS_KEY,
          },
        })
      : null;

  get configured() {
    return this.s3 !== null;
  }

  /**
   * The conversation as speaker-tagged lines, or null when Agora has not
   * written anything for this consultation yet.
   */
  async fetch(requestId: string): Promise<string | null> {
    if (!this.s3) return null;

    const prefix = `transcripts/${requestId}/`;

    try {
      const listed = await this.s3.send(
        new ListObjectsV2Command({ Bucket: env.TRANSCRIPT_BUCKET, Prefix: prefix }),
      );

      // A long call can be split across files; they sort into order by key,
      // which carries the start time.
      const keys = (listed.Contents ?? [])
        .map((object) => object.Key)
        .filter((key): key is string => Boolean(key?.endsWith('.vtt')))
        .sort();
      if (keys.length === 0) return null;

      const parts: string[] = [];
      for (const key of keys) {
        const object = await this.s3.send(
          new GetObjectCommand({ Bucket: env.TRANSCRIPT_BUCKET, Key: key }),
        );
        const body = await object.Body?.transformToString();
        if (body) parts.push(body);
      }

      const spoken = parts.map((part) => readVtt(part)).join('\n').trim();
      return spoken || null;
    } catch (error) {
      this.logger.error({ err: error }, `Could not read the transcript for ${requestId}.`);
      return null;
    }
  }
}

/**
 * WebVTT to plain conversation.
 *
 * Timings and cue numbers are dropped — the report is about what was said,
 * not when — and consecutive lines from one speaker are run together so the
 * result reads like a conversation rather than subtitles.
 */
export function readVtt(vtt: string) {
  const lines: { who: string; text: string }[] = [];

  for (const block of vtt.split(/\r?\n\r?\n/)) {
    const rows = block
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter(Boolean)
      // The header, the cue number and the timing line are all scaffolding.
      .filter((row) => row !== 'WEBVTT' && !TIMING.test(row) && !/^\d+$/.test(row));

    for (const row of rows) {
      const voice = VOICE.exec(row);
      const who = speaker(voice?.[1]);
      const text = (voice ? voice[2] : row).replace(/<[^>]+>/g, '').trim();
      if (!text) continue;

      const last = lines.at(-1);
      if (last && last.who === who) last.text += ' ' + text;
      else lines.push({ who, text });
    }
  }

  return lines.map((line) => `${line.who}: ${line.text}`).join('\n');
}

/** Agora tags each cue with the uid that spoke; we know who those are. */
function speaker(uid: string | undefined) {
  if (uid === LAWYER_UID) return 'Lawyer';
  if (uid === CUSTOMER_UID) return 'Client';
  return 'Speaker';
}
