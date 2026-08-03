import { defineEnv, z } from "@transcribemind/config";

export const env = defineEnv(
  z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    JWT_SECRET: z.string().min(16),
    JWT_EXPIRES_IN: z.string().default("7d"),
    S3_BUCKET: z.string(),
    S3_ENDPOINT: z.string().url(),
    S3_REGION: z.string().default("us-east-1"),
    S3_ACCESS_KEY_ID: z.string(),
    S3_SECRET_ACCESS_KEY: z.string(),
    S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    OPENAI_API_KEY: z.string(),
    // How long a completed video's raw file stays in object storage before
    // the retention job deletes it (transcript/analysis are kept forever).
    VIDEO_RETENTION_DAYS: z.coerce.number().default(30),
    // Deliberately independent from NODE_ENV: a "production" build can still
    // be served over plain HTTP (e.g. this app's own Docker Compose setup),
    // and browsers silently refuse to store a Secure cookie on non-HTTPS
    // origins — which would otherwise break login with no visible error.
    // Only flip this on when the app is actually served over HTTPS.
    COOKIE_SECURE: z.coerce.boolean().default(false),
  }),
);
