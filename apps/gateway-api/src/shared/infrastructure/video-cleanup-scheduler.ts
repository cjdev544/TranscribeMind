import type { Logger } from "@transcribemind/logger";
import type { CleanupExpiredVideoFilesUseCase } from "../../modules/videos/application/cleanup-expired-video-files.use-case.js";

const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

/**
 * Single-process interval scheduler — matches this app's existing "one
 * Postgres, no per-service infra" MVP simplification (see schema.prisma).
 * A multi-instance deployment would need to move this to a proper cron/lock
 * mechanism so it doesn't run once per instance; not a concern at this scale.
 */
export function scheduleVideoCleanup(cleanupUseCase: CleanupExpiredVideoFilesUseCase, logger: Logger): void {
  const runSweep = () => {
    cleanupUseCase.execute().catch((error) => {
      logger.error({ err: error }, "Video file retention sweep failed");
    });
  };

  runSweep();
  setInterval(runSweep, SWEEP_INTERVAL_MS);
}
