import { afterEach, describe, expect, it, vi } from "vitest";
import { scheduleVideoCleanup } from "./video-cleanup-scheduler.js";
import type { CleanupExpiredVideoFilesUseCase } from "../../modules/videos/application/cleanup-expired-video-files.use-case.js";

describe("scheduleVideoCleanup", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs the cleanup sweep immediately on schedule", () => {
    const execute = vi.fn().mockResolvedValue({ deletedCount: 0 });
    const cleanupUseCase = { execute } as unknown as CleanupExpiredVideoFilesUseCase;

    scheduleVideoCleanup(cleanupUseCase, { error: vi.fn() } as never);

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("runs the sweep again every 6 hours", () => {
    vi.useFakeTimers();
    const execute = vi.fn().mockResolvedValue({ deletedCount: 0 });
    const cleanupUseCase = { execute } as unknown as CleanupExpiredVideoFilesUseCase;

    scheduleVideoCleanup(cleanupUseCase, { error: vi.fn() } as never);
    expect(execute).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(6 * 60 * 60 * 1000);

    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("logs but does not throw when a sweep run fails", async () => {
    const execute = vi.fn().mockRejectedValue(new Error("db down"));
    const cleanupUseCase = { execute } as unknown as CleanupExpiredVideoFilesUseCase;
    const logger = { error: vi.fn() };

    expect(() => scheduleVideoCleanup(cleanupUseCase, logger as never)).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));

    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ err: expect.any(Error) }), "Video file retention sweep failed");
  });
});
