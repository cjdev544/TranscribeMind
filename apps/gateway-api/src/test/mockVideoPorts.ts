import { vi } from "vitest";
import { SummaryLanguage, VideoStatus } from "@transcribemind/contracts";
import type { Logger } from "@transcribemind/logger";
import type { Video } from "../modules/videos/domain/video.entity.js";
import type { VideoRepositoryPort } from "../modules/videos/domain/ports/video-repository.port.js";
import type { ObjectStoragePort } from "../modules/videos/domain/ports/object-storage.port.js";
import type { JobQueuePort } from "../modules/videos/domain/ports/job-queue.port.js";
import type { StatusPublisherPort } from "../modules/videos/domain/ports/status-publisher.port.js";
import type { VideoChatPort } from "../modules/videos/domain/ports/video-chat.port.js";
import type { RemoteVideoFetcherPort } from "../modules/videos/domain/ports/remote-video-fetcher.port.js";

export function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    id: "v1",
    userId: "u1",
    title: null,
    originalFilename: "clip.mp4",
    s3Key: "videos/u1/v1-clip.mp4",
    summaryLanguage: SummaryLanguage.ES,
    status: VideoStatus.QUEUED,
    progress: 0,
    durationSeconds: null,
    transcript: null,
    transcriptSegments: null,
    analysis: null,
    error: null,
    completedAt: null,
    fileDeletedAt: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

export function mockVideoRepository(overrides: Partial<VideoRepositoryPort> = {}): VideoRepositoryPort {
  return {
    create: vi.fn().mockResolvedValue(makeVideo()),
    findById: vi.fn().mockResolvedValue(null),
    listByUser: vi.fn().mockResolvedValue([]),
    resetForRetry: vi.fn(),
    updateTitle: vi.fn(),
    delete: vi.fn(),
    finalizeUpload: vi.fn().mockResolvedValue(makeVideo()),
    markFailed: vi.fn(),
    markFileDeleted: vi.fn(),
    listCompletedBefore: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

export function mockObjectStorage(overrides: Partial<ObjectStoragePort> = {}): ObjectStoragePort {
  return {
    upload: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    download: vi.fn(),
    ...overrides,
  };
}

export function mockJobQueue(overrides: Partial<JobQueuePort> = {}): JobQueuePort {
  return {
    enqueueVideoProcessing: vi.fn(),
    ...overrides,
  };
}

export function mockStatusPublisher(overrides: Partial<StatusPublisherPort> = {}): StatusPublisherPort {
  return {
    publish: vi.fn(),
    ...overrides,
  };
}

export function mockVideoChat(overrides: Partial<VideoChatPort> = {}): VideoChatPort {
  return {
    ask: vi.fn().mockResolvedValue("respuesta"),
    ...overrides,
  };
}

export function mockRemoteVideoFetcher(overrides: Partial<RemoteVideoFetcherPort> = {}): RemoteVideoFetcherPort {
  return {
    fetch: vi.fn(),
    ...overrides,
  };
}

export function mockLogger(): Logger {
  return { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } as unknown as Logger;
}

/** A minimal real video container so UploadVideoUseCase's signature check passes. */
export function fakeMp4Buffer(): Buffer {
  return Buffer.concat([Buffer.from([0, 0, 0, 0x20]), Buffer.from("ftypisom")]);
}
