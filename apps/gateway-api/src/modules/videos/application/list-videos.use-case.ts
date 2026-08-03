import type { VideoStatus } from "@transcribemind/contracts";
import type { Video } from "../domain/video.entity.js";
import type { VideoRepositoryPort } from "../domain/ports/video-repository.port.js";

export interface ListVideosInput {
  userId: string;
  status?: VideoStatus;
  search?: string;
}

export class ListVideosUseCase {
  constructor(private readonly videoRepository: VideoRepositoryPort) {}

  execute(input: ListVideosInput): Promise<Video[]> {
    return this.videoRepository.listByUser(input);
  }
}
