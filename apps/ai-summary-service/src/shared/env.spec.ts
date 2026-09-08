import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const REQUIRED_ENV = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/db",
  REDIS_URL: "redis://localhost:6379",
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

  it("applies the default NODE_ENV", async () => {
    const { env } = await import("./env.js");

    expect(env.NODE_ENV).toBe("development");
  });

  it("throws when a required var like OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(import("./env.js")).rejects.toThrow("Invalid environment configuration");
  });

  it("throws when DATABASE_URL is not a valid URL", async () => {
    process.env.DATABASE_URL = "not-a-url";

    await expect(import("./env.js")).rejects.toThrow("Invalid environment configuration");
  });
});
