import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// Load .env from the api package root. In production, real env vars take precedence.
loadDotenv();

const isProd = process.env.NODE_ENV === 'production';

// Dev/test fallbacks so the app and tests boot without a filled .env.
// Production REQUIRES real secrets (enforced below).
const DEV_SECRET = 'dev-only-insecure-secret-change-me-in-production-0000000000';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),

    // Prisma also reads DATABASE_URL/DIRECT_URL directly. Kept optional here so the
    // process can start for offline work; queries fail clearly if the DB is unreachable.
    DATABASE_URL: z.string().optional(),
    DIRECT_URL: z.string().optional(),

    // Storage. When Supabase is not configured, the app falls back to local disk.
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_STORAGE_BUCKET: z.string().default('resumes'),
    LOCAL_STORAGE_DIR: z.string().default('.storage'),

    // Auth
    JWT_ACCESS_SECRET: z.string().min(1).default(isProd ? '' : DEV_SECRET),
    JWT_REFRESH_SECRET: z.string().min(1).default(isProd ? '' : `${DEV_SECRET}-refresh`),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // AI provider. Defaults to mock so the full flow runs with zero external keys.
    AI_PROVIDER: z.enum(['openai', 'mock']).default('mock'),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),

    // Uploads
    MAX_FILE_SIZE_MB: z.coerce.number().positive().default(5),

    // Rate limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV === 'production') {
      if (val.JWT_ACCESS_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_ACCESS_SECRET'],
          message: 'JWT_ACCESS_SECRET must be at least 32 characters in production',
        });
      }
      if (val.JWT_REFRESH_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_REFRESH_SECRET'],
          message: 'JWT_REFRESH_SECRET must be at least 32 characters in production',
        });
      }
      if (val.AI_PROVIDER === 'openai' && !val.OPENAI_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['OPENAI_API_KEY'],
          message: 'OPENAI_API_KEY is required when AI_PROVIDER=openai',
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Crash at startup with a clear message rather than failing deep in a request.
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:');
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

export const MAX_FILE_SIZE_BYTES = env.MAX_FILE_SIZE_MB * 1024 * 1024;

/** True when Supabase Storage is configured; otherwise the app uses local disk storage. */
export const useSupabaseStorage = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
