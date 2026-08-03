import { NotFoundError, UnauthorizedError } from "../../../shared/kernel/domain-error.js";
import type { Video } from "../domain/video.entity.js";
import type { VideoRepositoryPort } from "../domain/ports/video-repository.port.js";

export class GetVideoUseCase {
  constructor(private readonly videoRepository: VideoRepositoryPort) {}

  async execute(input: { videoId: string; requesterId: string }): Promise<Video> {
    const video = await this.videoRepository.findById(input.videoId);
    if (!video) {
      throw new NotFoundError("Video not found");
    }

    // Multi-tenant guard: a user may only read their own videos.
    if (video.userId !== input.requesterId) {
      throw new UnauthorizedError("You do not have access to this video");
    }

    return video;
  }
}
