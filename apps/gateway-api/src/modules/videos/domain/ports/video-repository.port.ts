import type { SummaryLanguage, VideoStatus } from "@transcribemind/contracts";
import type { Video } from "../video.entity.js";

export interface ListVideosFilter {
  userId: string;
  status?: VideoStatus;
  search?: string;
}

export interface VideoRepositoryPort {
  create(input: {
    userId: string;
    title?: string | null;
    originalFilename: string;
    s3Key: string;
    summaryLanguage: SummaryLanguage;
  }): Promise<Video>;
  findById(id: string): Promise<Video | null>;
  listByUser(filter: ListVideosFilter): Promise<Video[]>;
  resetForRetry(id: string): Promise<void>;
  updateTitle(id: string, title: string | null): Promise<void>;
  delete(id: string): Promise<void>;
  /** Overwrites the placeholder filename/key of a video created before its remote source finished downloading. */
  finalizeUpload(id: string, input: { originalFilename: string; s3Key: string }): Promise<Video>;
  markFailed(id: string, error: string): Promise<void>;
  markFileDeleted(id: string): Promise<void>;
  /** COMPLETED videos whose raw file hasn't been cleaned up yet and completed before `cutoff` — the retention job's candidates. */
  listCompletedBefore(cutoff: Date): Promise<Video[]>;
}
