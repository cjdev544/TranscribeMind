import { describe, expect, it, vi } from "vitest";
import { VideoStatus } from "@transcribemind/contracts";
import { ProcessVideoUseCase } from "./process-video.use-case.js";
import {
  mockVideoDownloader,
  mockAudioExtractor,
  mockAudioSplitter,
  mockTranscriptionProvider,
  mockTranscriptTranslator,
  mockStatusPublisher,
  mockVideoRepository,
  mockLogger,
} from "../../../test/mockTranscriptionPorts.js";

function buildDeps(overrides: Record<string, unknown> = {}) {
  return {
    videoDownloader: mockVideoDownloader(),
    audioExtractor: mockAudioExtractor(),
    audioSplitter: mockAudioSplitter(),
    transcriptionProvider: mockTranscriptionProvider(),
    transcriptTranslator: mockTranscriptTranslator(),
    statusPublisher: mockStatusPublisher(),
    videoRepository: mockVideoRepository(),
    logger: mockLogger(),
    ...overrides,
  };
}

const input = { videoId: "v1", userId: "u1", s3Key: "videos/u1/v1.mp4", summaryLanguage: "es" as const };

describe("ProcessVideoUseCase", () => {
  it("runs the single-request path when the audio is under Whisper's limit", async () => {
    const deps = buildDeps({
      audioExtractor: mockAudioExtractor({
        extract: vi.fn().mockResolvedValue({ audioFilePath: "/tmp/a.mp3", sizeBytes: 1000, durationSeconds: 60 }),
      }),
      transcriptionProvider: mockTranscriptionProvider({
        transcribe: vi.fn().mockResolvedValue({ text: "hola mundo", segments: [{ start: 0, end: 1, text: "hola mundo" }], language: "spanish" }),
      }),
    });
    const useCase = new ProcessVideoUseCase(deps as never);

    const result = await useCase.execute(input);

    expect(deps.audioSplitter.split).not.toHaveBeenCalled();
    expect(result.transcript).toBe("hola mundo");
    expect(deps.videoRepository.saveTranscript).toHaveBeenCalledWith("v1", "hola mundo", expect.any(Array));
  });

  it("splits into chunks and transcribes each one when the audio exceeds Whisper's 25MB limit", async () => {
    const deps = buildDeps({
      audioExtractor: mockAudioExtractor({
        extract: vi.fn().mockResolvedValue({ audioFilePath: "/tmp/a.mp3", sizeBytes: 30 * 1024 * 1024, durationSeconds: 600 }),
      }),
      audioSplitter: mockAudioSplitter({
        split: vi.fn().mockResolvedValue([
          { filePath: "/tmp/chunk1.mp3", offsetSeconds: 0 },
          { filePath: "/tmp/chunk2.mp3", offsetSeconds: 300 },
        ]),
      }),
      transcriptionProvider: mockTranscriptionProvider({
        transcribe: vi.fn().mockResolvedValue({ text: "parte", segments: [{ start: 0, end: 1, text: "parte" }], language: "spanish" }),
      }),
    });
    const useCase = new ProcessVideoUseCase(deps as never);

    await useCase.execute(input);

    expect(deps.audioSplitter.split).toHaveBeenCalled();
    expect(deps.transcriptionProvider.transcribe).toHaveBeenCalledTimes(2);
  });

  it("translates the transcript when the detected language does not match the requested summary language", async () => {
    const deps = buildDeps({
      transcriptionProvider: mockTranscriptionProvider({
        transcribe: vi.fn().mockResolvedValue({ text: "hello", segments: [{ start: 0, end: 1, text: "hello" }], language: "english" }),
      }),
      transcriptTranslator: mockTranscriptTranslator({
        translateSegments: vi.fn().mockResolvedValue([{ start: 0, end: 1, text: "hola" }]),
      }),
    });
    const useCase = new ProcessVideoUseCase(deps as never);

    const result = await useCase.execute(input);

    expect(deps.transcriptTranslator.translateSegments).toHaveBeenCalled();
    expect(result.transcript).toBe("hola");
  });

  it("skips translation when the detected language already matches", async () => {
    const deps = buildDeps({
      transcriptionProvider: mockTranscriptionProvider({
        transcribe: vi.fn().mockResolvedValue({ text: "hola", segments: [{ start: 0, end: 1, text: "hola" }], language: "spanish" }),
      }),
    });
    const useCase = new ProcessVideoUseCase(deps as never);

    await useCase.execute(input);

    expect(deps.transcriptTranslator.translateSegments).not.toHaveBeenCalled();
  });

  it("progresses through the expected status sequence", async () => {
    const deps = buildDeps();
    const useCase = new ProcessVideoUseCase(deps as never);

    await useCase.execute(input);

    const statuses = vi.mocked(deps.videoRepository.updateStatus).mock.calls.map((call) => call[1]);
    expect(statuses).toEqual([VideoStatus.PROCESSING_AUDIO, VideoStatus.TRANSCRIBING, VideoStatus.ANALYZING_AI]);
  });

  it("saves the extracted audio duration", async () => {
    const deps = buildDeps({
      audioExtractor: mockAudioExtractor({
        extract: vi.fn().mockResolvedValue({ audioFilePath: "/tmp/a.mp3", sizeBytes: 1000, durationSeconds: 123 }),
      }),
    });
    const useCase = new ProcessVideoUseCase(deps as never);

    await useCase.execute(input);

    expect(deps.videoRepository.saveDuration).toHaveBeenCalledWith("v1", 123);
  });
});
