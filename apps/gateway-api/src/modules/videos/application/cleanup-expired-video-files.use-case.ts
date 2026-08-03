import type { Logger } from "@transcribemind/logger";
import type { VideoRepositoryPort } from "../domain/ports/video-repository.port.js";
import type { ObjectStoragePort } from "../domain/ports/object-storage.port.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Scheduled retention sweep: deletes the raw video file for anything that
 * finished processing more than `retentionDays` ago, keeping the row,
 * transcript, and analysis untouched — those are the actual product value
 * and cost near-nothing to keep, unlike the source video file.
 */
export class CleanupExpiredVideoFilesUseCase {
  constructor(
    private readonly videoRepository: VideoRepositoryPort,
    private readonly objectStorage: ObjectStoragePort,
    private readonly logger: Logger,
    private readonly retentionDays: number,
  ) {}

  async execute(): Promise<{ deletedCount: number }> {
    const cutoff = new Date(Date.now() - this.retentionDays * DAY_MS);
    const expired = await this.videoRepository.listCompletedBefore(cutoff);

    let deletedCount = 0;
    for (const video of expired) {
      try {
        await this.objectStorage.delete(video.s3Key);
        await this.videoRepository.markFileDeleted(video.id);
        deletedCount += 1;
      } catch (error) {
        // One video's failure (e.g. a transient S3 error) shouldn't stop the
        // rest of the sweep — it'll just get picked up again next run.
        this.logger.error({ err: error, videoId: video.id }, "Failed to delete expired video file");
      }
    }

    if (deletedCount > 0) {
      this.logger.info({ deletedCount, retentionDays: this.retentionDays }, "Cleaned up expired video files");
    }

    return { deletedCount };
  }
}
