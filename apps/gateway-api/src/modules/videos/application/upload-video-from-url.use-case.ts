import { randomUUID } from "node:crypto";
import { DEFAULT_SUMMARY_LANGUAGE, VideoStatus, type SummaryLanguage } from "@transcribemind/contracts";
import type { Logger } from "@transcribemind/logger";
import type { Video } from "../domain/video.entity.js";
import type { RemoteVideoFetcherPort } from "../domain/ports/remote-video-fetcher.port.js";
import type { VideoRepositoryPort } from "../domain/ports/video-repository.port.js";
import type { StatusPublisherPort } from "../domain/ports/status-publisher.port.js";
import { DomainError } from "../../../shared/kernel/domain-error.js";
import { normalizeTitle } from "../domain/video-title.js";
import type { UploadVideoUseCase } from "./upload-video.use-case.js";

export interface UploadVideoFromUrlInput {
  userId: string;
  /** User-supplied display name; blank/omitted falls back to the downloaded filename in the UI. */
  title?: string;
  url: string;
  summaryLanguage?: SummaryLanguage;
}

export class UploadVideoFromUrlUseCase {
  constructor(
    private readonly remoteVideoFetcher: RemoteVideoFetcherPort,
    private readonly uploadVideoUseCase: UploadVideoUseCase,
    private readonly videoRepository: VideoRepositoryPort,
    private readonly statusPublisher: StatusPublisherPort,
    private readonly logger: Logger,
  ) {}

  async execute(input: UploadVideoFromUrlInput): Promise<Video> {
    const summaryLanguage = input.summaryLanguage ?? DEFAULT_SUMMARY_LANGUAGE;

    // Fetching a remote URL (especially via yt-dlp) can take minutes, far
    // longer than an HTTP request should stay open. A placeholder row is
    // created and returned immediately so the client gets a video id to
    // track right away — the slow part runs in the background and finalizes
    // this same row once the file is actually in hand.
    const placeholder = await this.videoRepository.create({
      userId: input.userId,
      title: normalizeTitle(input.title),
      originalFilename: "Descargando video...",
      s3Key: `videos/${input.userId}/${randomUUID()}-pending`,
      summaryLanguage,
    });

    void this.downloadAndFinalize(placeholder.id, input.userId, input.url, summaryLanguage);

    return placeholder;
  }

  private async downloadAndFinalize(
    videoId: string,
    userId: string,
    url: string,
    summaryLanguage: SummaryLanguage,
  ): Promise<void> {
    try {
      // Publishes at most once per whole percentage point (the fetcher
      // already dedupes repeats), so the client sees live movement during
      // what would otherwise be several silent minutes on a long video.
      const remoteVideo = await this.remoteVideoFetcher.fetch(url, (percent) => {
        void this.statusPublisher.publish({
          videoId,
          userId,
          status: VideoStatus.QUEUED,
          progress: percent,
        });
      });

      await this.uploadVideoUseCase.execute({
        userId,
        originalFilename: remoteVideo.filename,
        mimeType: remoteVideo.contentType,
        fileBuffer: remoteVideo.buffer,
        summaryLanguage,
        existingVideoId: videoId,
      });
    } catch (error) {
      const message = error instanceof DomainError ? error.message : "No se pudo descargar el video desde la URL";
      this.logger.error({ err: error, videoId }, "Background URL download failed");

      await this.videoRepository.markFailed(videoId, message);
      await this.statusPublisher.publish({
        videoId,
        userId,
        status: VideoStatus.FAILED,
        progress: 0,
        error: message,
      });
    }
  }
}
