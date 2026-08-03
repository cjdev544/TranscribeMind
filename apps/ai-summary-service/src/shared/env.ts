import { defineEnv, z } from "@transcribemind/config";

export const env = defineEnv(
  z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    OPENAI_API_KEY: z.string(),
  }),
);
