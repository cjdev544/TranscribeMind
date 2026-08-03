import { DomainError, NotFoundError, UnauthorizedError } from "../../../shared/kernel/domain-error.js";
import type { VideoRepositoryPort } from "../domain/ports/video-repository.port.js";
import type { DownloadedObject, ObjectStoragePort } from "../domain/ports/object-storage.port.js";

export class StreamVideoUseCase {
  constructor(
    private readonly videoRepository: VideoRepositoryPort,
    private readonly objectStorage: ObjectStoragePort,
  ) {}

  async execute(input: { videoId: string; requesterId: string; range?: string }): Promise<DownloadedObject> {
    const video = await this.videoRepository.findById(input.videoId);
    if (!video) {
      throw new NotFoundError("Video not found");
    }
    if (video.userId !== input.requesterId) {
      throw new UnauthorizedError("You do not have access to this video");
    }
    if (video.fileDeletedAt) {
      // Without this, the S3 GetObject 404 would surface as a raw
      // "NoSuchKey" error instead of an explanation the UI can show.
      throw new DomainError(
        "El archivo original de este video ya no está disponible (se eliminó automáticamente para ahorrar espacio).",
        "VALIDATION_ERROR",
        410,
      );
    }

    return this.objectStorage.download({ key: video.s3Key, range: input.range });
  }
}
