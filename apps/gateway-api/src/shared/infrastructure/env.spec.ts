import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const REQUIRED_ENV = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/db",
  REDIS_URL: "redis://localhost:6379",
  JWT_SECRET: "a-secret-at-least-16-chars",
  S3_BUCKET: "bucket",
  S3_ENDPOINT: "https://s3.example.com",
  S3_ACCESS_KEY_ID: "key",
  S3_SECRET_ACCESS_KEY: "secret",
  OPENAI_API_KEY: "key",
};

describe("env", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, ...REQUIRED_ENV };
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("applies defaults for optional fields", async () => {
    const { env } = await import("./env.js");

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe("development");
    expect(env.JWT_EXPIRES_IN).toBe("7d");
    expect(env.COOKIE_SECURE).toBe(false);
    expect(env.VIDEO_RETENTION_DAYS).toBe(30);
  });

  it("coerces PORT to a number", async () => {
    process.env.PORT = "4321";

    const { env } = await import("./env.js");

    expect(env.PORT).toBe(4321);
  });

  it("throws when a required var like JWT_SECRET is missing", async () => {
    delete process.env.JWT_SECRET;

    await expect(import("./env.js")).rejects.toThrow("Invalid environment configuration");
  });

  it("throws when DATABASE_URL is not a valid URL", async () => {
    process.env.DATABASE_URL = "not-a-url";

    await expect(import("./env.js")).rejects.toThrow("Invalid environment configuration");
  });
});
