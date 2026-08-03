import { NotFoundError, UnauthorizedError } from "../../../shared/kernel/domain-error.js";
import type { Video } from "../domain/video.entity.js";
import type { VideoRepositoryPort } from "../domain/ports/video-repository.port.js";
import { normalizeTitle } from "../domain/video-title.js";

export class UpdateVideoTitleUseCase {
  constructor(private readonly videoRepository: VideoRepositoryPort) {}

  async execute(input: { videoId: string; requesterId: string; title: string }): Promise<Video> {
    const video = await this.videoRepository.findById(input.videoId);
    if (!video) {
      throw new NotFoundError("Video not found");
    }
    if (video.userId !== input.requesterId) {
      throw new UnauthorizedError("You do not have access to this video");
    }

    const title = normalizeTitle(input.title);
    await this.videoRepository.updateTitle(video.id, title);

    return { ...video, title };
  }
}
