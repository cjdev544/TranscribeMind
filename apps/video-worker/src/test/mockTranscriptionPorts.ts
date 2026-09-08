import { vi } from "vitest";
import type { VideoDownloaderPort } from "../modules/transcription/domain/ports/video-downloader.port.js";
import type { AudioExtractorPort } from "../modules/transcription/domain/ports/audio-extractor.port.js";
import type { AudioSplitterPort } from "../modules/transcription/domain/ports/audio-splitter.port.js";
import type { TranscriptionProviderPort } from "../modules/transcription/domain/ports/transcription-provider.port.js";
import type { TranscriptTranslatorPort } from "../modules/transcription/domain/ports/transcript-translator.port.js";
import type { StatusPublisherPort } from "../modules/transcription/domain/ports/status-publisher.port.js";
import type { VideoStatusRepositoryPort, VideoRecord } from "../modules/transcription/domain/ports/video-status-repository.port.js";

export function mockVideoDownloader(overrides: Partial<VideoDownloaderPort> = {}): VideoDownloaderPort {
  return { download: vi.fn().mockResolvedValue({ filePath: "/tmp/video.mp4" }), ...overrides };
}

export function mockAudioExtractor(overrides: Partial<AudioExtractorPort> = {}): AudioExtractorPort {
  return {
    extract: vi.fn().mockResolvedValue({ audioFilePath: "/tmp/audio.mp3", sizeBytes: 1000, durationSeconds: 60 }),
    ...overrides,
  };
}

export function mockAudioSplitter(overrides: Partial<AudioSplitterPort> = {}): AudioSplitterPort {
  return { split: vi.fn().mockResolvedValue([]), ...overrides };
}

export function mockTranscriptionProvider(overrides: Partial<TranscriptionProviderPort> = {}): TranscriptionProviderPort {
  return {
    transcribe: vi.fn().mockResolvedValue({ text: "hola", segments: [{ start: 0, end: 1, text: "hola" }], language: "spanish" }),
    ...overrides,
  };
}

export function mockTranscriptTranslator(overrides: Partial<TranscriptTranslatorPort> = {}): TranscriptTranslatorPort {
  return { translateSegments: vi.fn().mockResolvedValue([]), ...overrides };
}

export function mockStatusPublisher(overrides: Partial<StatusPublisherPort> = {}): StatusPublisherPort {
  return { publish: vi.fn(), ...overrides };
}

export function mockVideoRepository(overrides: Partial<VideoStatusRepositoryPort> = {}): VideoStatusRepositoryPort {
  return {
    findById: vi.fn().mockResolvedValue(null),
    updateStatus: vi.fn(),
    saveDuration: vi.fn(),
    saveTranscript: vi.fn(),
    markFailed: vi.fn(),
    ...overrides,
  };
}

export function mockLogger() {
  return { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } as never;
}

export function makeVideoRecord(overrides: Partial<VideoRecord> = {}): VideoRecord {
  return { id: "v1", userId: "u1", s3Key: "videos/u1/v1.mp4", status: "QUEUED" as never, ...overrides };
}
