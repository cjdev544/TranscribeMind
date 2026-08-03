import { VideoStatus } from "@transcribemind/contracts";
import { ConflictError, NotFoundError, UnauthorizedError } from "../../../shared/kernel/domain-error.js";
import type { VideoRepositoryPort } from "../domain/ports/video-repository.port.js";
import type { JobQueuePort } from "../domain/ports/job-queue.port.js";

export class RetryVideoUseCase {
  constructor(
    private readonly videoRepository: VideoRepositoryPort,
    private readonly jobQueue: JobQueuePort,
  ) {}

  async execute(input: { videoId: string; requesterId: string }): Promise<void> {
    const video = await this.videoRepository.findById(input.videoId);
    if (!video) {
      throw new NotFoundError("Video not found");
    }
    if (video.userId !== input.requesterId) {
      throw new UnauthorizedError("You do not have access to this video");
    }
    if (video.status !== VideoStatus.FAILED) {
      throw new ConflictError("Only failed videos can be retried");
    }

    await this.videoRepository.resetForRetry(video.id);
    await this.jobQueue.enqueueVideoProcessing({
      videoId: video.id,
      userId: video.userId,
      s3Key: video.s3Key,
      summaryLanguage: video.summaryLanguage,
    });
  }
}
