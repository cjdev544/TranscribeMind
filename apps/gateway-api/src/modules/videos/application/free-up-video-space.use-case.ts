import { VideoStatus } from "@transcribemind/contracts";
import { DomainError, NotFoundError, UnauthorizedError } from "../../../shared/kernel/domain-error.js";
import type { VideoRepositoryPort } from "../domain/ports/video-repository.port.js";
import type { ObjectStoragePort } from "../domain/ports/object-storage.port.js";

/** User-triggered equivalent of the retention job — deletes the raw file immediately, keeps everything else. */
export class FreeUpVideoSpaceUseCase {
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
    if (video.status !== VideoStatus.COMPLETED) {
      throw new DomainError("Solo se puede liberar espacio de videos ya procesados", "VALIDATION_ERROR", 400);
    }

    if (video.fileDeletedAt) {
      return;
    }

    await this.objectStorage.delete(video.s3Key);
    await this.videoRepository.markFileDeleted(video.id);
  }
}
