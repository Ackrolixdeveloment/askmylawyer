import { z } from 'zod';

const bool = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const list = z
  .string()
  .default('')
  .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  COOKIE_DOMAIN: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  COOKIE_SECURE: bool,

  APP_REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  ALLOW_MULTI_ROLE_PHONE: bool,

  OTP_BYPASS_ENABLED: bool,
  OTP_BYPASS_CODE: z.string().regex(/^\d{6}$/, 'OTP_BYPASS_CODE must be 6 digits').default('123456'),
  OTP_TTL_MINUTES: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(20),
  OTP_MAX_SENDS_PER_HOUR: z.coerce.number().int().positive().default(5),

  RESEND_API_KEY: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  /** Verified sender in the Resend dashboard. */
  RESEND_FROM_EMAIL: z.string().default('onboarding@resend.dev'),
  RESEND_FROM_NAME: z.string().default('Ask My Lawyer'),

  /**
   * MSG91, for the SMS codes that sign customers and lawyers in.
   *
   * MSG91_OTP_MESSAGE must match the DLT-approved template word for word,
   * `{otp}` being the only variable — India's DLT registry drops anything
   * that differs, so this is configuration, not copy to be reworded.
   */
  MSG91_AUTH_KEY: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  MSG91_SENDER_ID: z.string().default('PULSAI'),
  MSG91_COUNTRY_CODE: z.string().default('91'),
  /** The DLT template entity id, when the account needs it sent explicitly. */
  MSG91_DLT_TE_ID: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  MSG91_SMS_URL: z.string().url().default('https://control.msg91.com/api/sendhttp.php'),
  MSG91_OTP_MESSAGE: z
    .string()
    .default('PULS~E AI: {otp} is your OTP for login. Kindly do not share your OTP with anyone.')
    .refine((value) => value.includes('{otp}'), {
      message: 'MSG91_OTP_MESSAGE must contain {otp}',
    }),

  GOOGLE_CLIENT_IDS: list,
  APPLE_CLIENT_IDS: list,

  /** AES-256 key for Aadhaar / bank account numbers. `openssl rand -base64 32` */
  DATA_ENCRYPTION_KEY: z
    .string()
    .refine((value) => Buffer.from(value, 'base64').length === 32, {
      message: 'DATA_ENCRYPTION_KEY must be 32 bytes, base64 encoded (openssl rand -base64 32)',
    }),

  /**
   * Firebase service account for FCM (Project settings → Service accounts).
   * Leave unset locally: pushes are logged instead of sent.
   */
  FIREBASE_PROJECT_ID: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  FIREBASE_PRIVATE_KEY: z
    .string()
    .optional()
    // Env files keep the key on one line with \n in place of the breaks.
    .transform((value) => value?.replace(/\\n/g, '\n') || undefined),

  /** Agora voice and video. The certificate signs per-call tokens. */
  AGORA_APP_ID: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  AGORA_APP_CERTIFICATE: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  /**
   * Agora's REST credentials, which are not the App ID pair above.
   *
   * Used server-side to start and stop speech-to-text on a live call — the
   * apps never see these.
   */
  AGORA_CUSTOMER_ID: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  AGORA_CUSTOMER_SECRET: z
    .string()
    .optional()
    .transform((value) => value || undefined),

  /**
   * Where Agora drops the transcript of a call. Agora writes to S3 itself,
   * so these are keys for a user with access to that one bucket and nothing
   * else — not the EC2 role the rest of the app uses.
   */
  TRANSCRIPT_BUCKET: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  TRANSCRIPT_BUCKET_REGION: z.string().default('ap-south-1'),
  TRANSCRIPT_AWS_ACCESS_KEY_ID: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  TRANSCRIPT_AWS_SECRET_ACCESS_KEY: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  /** How long to wait for Agora's file before giving the lawyer a blank report. */
  TRANSCRIPT_WAIT_SECONDS: z.coerce.number().int().positive().default(180),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./storage'),
  S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().default('ap-south-1'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_FORMAT: z.enum(['pretty', 'json']).default('json'),
});

export type Env = z.infer<typeof schema>;

// Local development reads backend/.env; on EC2 the variables are set on the container.
try {
  process.loadEnvFile();
} catch {
  // No .env file — rely on the real environment.
}

/** Validated once at startup — a bad or missing value stops the app with a clear message. */
export const env: Env = (() => {
  const parsed = schema
    .refine((value) => value.STORAGE_DRIVER !== 's3' || Boolean(value.S3_BUCKET), {
      message: 'S3_BUCKET is required when STORAGE_DRIVER=s3',
      path: ['S3_BUCKET'],
    })
    .safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`Invalid environment configuration:\n${issues}`);
    process.exit(1);
  }
  return parsed.data;
})();
