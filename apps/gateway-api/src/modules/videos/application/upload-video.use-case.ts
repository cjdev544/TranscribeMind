import { randomUUID } from "node:crypto";
import { DEFAULT_SUMMARY_LANGUAGE, type SummaryLanguage } from "@transcribemind/contracts";
import type { Video } from "../domain/video.entity.js";
import type { VideoRepositoryPort } from "../domain/ports/video-repository.port.js";
import type { ObjectStoragePort } from "../domain/ports/object-storage.port.js";
import type { JobQueuePort } from "../domain/ports/job-queue.port.js";
import { isAppleDoubleFile, isRecognizedVideoContainer } from "../domain/video-signature.js";
import { normalizeTitle } from "../domain/video-title.js";
import { DomainError } from "../../../shared/kernel/domain-error.js";

export interface UploadVideoInput {
  userId: string;
  /** User-supplied display name; blank/omitted falls back to the filename in the UI. */
  title?: string;
  originalFilename: string;
  mimeType: string;
  fileBuffer: Buffer;
  summaryLanguage?: SummaryLanguage;
  /** When set, overwrites this previously-created placeholder row instead of inserting a new one. */
  existingVideoId?: string;
}

export class UploadVideoUseCase {
  constructor(
    private readonly videoRepository: VideoRepositoryPort,
    private readonly objectStorage: ObjectStoragePort,
    private readonly jobQueue: JobQueuePort,
  ) {}

  async execute(input: UploadVideoInput): Promise<Video> {
    this.assertIsVideoFile(input);

    const s3Key = `videos/${input.userId}/${randomUUID()}-${input.originalFilename}`;
    const summaryLanguage = input.summaryLanguage ?? DEFAULT_SUMMARY_LANGUAGE;

    await this.objectStorage.upload({
      key: s3Key,
      body: input.fileBuffer,
      contentType: input.mimeType,
    });

    const video = input.existingVideoId
      ? await this.videoRepository.finalizeUpload(input.existingVideoId, {
          originalFilename: input.originalFilename,
          s3Key,
        })
      : await this.videoRepository.create({
          userId: input.userId,
          title: normalizeTitle(input.title),
          originalFilename: input.originalFilename,
          s3Key,
          summaryLanguage,
        });

    await this.jobQueue.enqueueVideoProcessing({
      videoId: video.id,
      userId: input.userId,
      s3Key,
      summaryLanguage,
    });

    return video;
  }

  private assertIsVideoFile(input: UploadVideoInput): void {
    if (isAppleDoubleFile(input.fileBuffer)) {
      throw new DomainError(
        `"${input.originalFilename}" es un archivo de metadatos de macOS (AppleDouble), no un video. ` +
          "Busca el archivo real sin el prefijo \"._\" y súbelo de nuevo.",
        "VALIDATION_ERROR",
        400,
      );
    }

    if (!isRecognizedVideoContainer(input.fileBuffer)) {
      throw new DomainError(
        `"${input.originalFilename}" no parece ser un archivo de video válido (mp4, mov, webm, mkv, avi o flv).`,
        "VALIDATION_ERROR",
        400,
      );
    }
  }
}
