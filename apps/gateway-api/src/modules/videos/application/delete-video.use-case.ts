import { NotFoundError, UnauthorizedError } from "../../../shared/kernel/domain-error.js";
import type { VideoRepositoryPort } from "../domain/ports/video-repository.port.js";
import type { ObjectStoragePort } from "../domain/ports/object-storage.port.js";

export class DeleteVideoUseCase {
  constructor(
    private readonly videoRepository: VideoRepositoryPort,
    private readonly objectStorage: ObjectStoragePort,
  ) {}

  async execute(input: { videoId: string; requesterId: string }): Promise<void> {
    const video = await this.videoRepository.findById(input.videoId);
    if (!video) {
      throw new NotFoundError("Video not found");
    }
    if (video.userId !== input.requesterId) {
      throw new UnauthorizedError("You do not have access to this video");
    }

    // Best-effort: the DB row is the source of truth for "does this video
    // exist", so it must go even if the S3 object was already missing.
    await this.objectStorage.delete(video.s3Key).catch(() => undefined);
    await this.videoRepository.delete(video.id);
  }
}
