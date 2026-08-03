import pLimit from "p-limit";
import { VideoStatus, type TranscriptionReadyJob } from "@transcribemind/contracts";
import type { Logger } from "@transcribemind/logger";
import type { VideoDownloaderPort } from "../domain/ports/video-downloader.port.js";
import type { AudioExtractorPort } from "../domain/ports/audio-extractor.port.js";
import type { AudioSplitterPort } from "../domain/ports/audio-splitter.port.js";
import type { TranscriptionProviderPort } from "../domain/ports/transcription-provider.port.js";
import type { TranscriptTranslatorPort } from "../domain/ports/transcript-translator.port.js";
import type { StatusPublisherPort } from "../domain/ports/status-publisher.port.js";
import type { VideoStatusRepositoryPort } from "../domain/ports/video-status-repository.port.js";
import { mergeTranscribedChunks, type TranscribedChunk } from "../domain/transcript.entity.js";
import { needsTranslation } from "../domain/detected-language.js";

/** OpenAI Whisper's hard request-body limit; anything larger must be chunked. */
const WHISPER_MAX_BYTES = 25 * 1024 * 1024;
/** Leave headroom below the hard limit for container/encoding overhead. */
const CHUNK_SIZE_BUDGET_BYTES = 20 * 1024 * 1024;
/** Bounded concurrency so we don't hammer OpenAI's rate limits when transcribing chunks in parallel. */
const MAX_CONCURRENT_TRANSCRIPTIONS = 3;

export interface ProcessVideoInput {
  videoId: string;
  userId: string;
  s3Key: string;
  summaryLanguage: TranscriptionReadyJob["summaryLanguage"];
}

export interface ProcessVideoDeps {
  videoDownloader: VideoDownloaderPort;
  audioExtractor: AudioExtractorPort;
  audioSplitter: AudioSplitterPort;
  transcriptionProvider: TranscriptionProviderPort;
  transcriptTranslator: TranscriptTranslatorPort;
  statusPublisher: StatusPublisherPort;
  videoRepository: VideoStatusRepositoryPort;
  logger: Logger;
}

export class ProcessVideoUseCase {
  constructor(private readonly deps: ProcessVideoDeps) {}

  async execute(input: ProcessVideoInput): Promise<TranscriptionReadyJob> {
    const { videoId, userId, s3Key, summaryLanguage } = input;
    const {
      videoDownloader,
      audioExtractor,
      audioSplitter,
      transcriptionProvider,
      transcriptTranslator,
      statusPublisher,
      videoRepository,
      logger,
    } = this.deps;

    await this.updateStatus(videoId, userId, VideoStatus.PROCESSING_AUDIO, 10);

    const { filePath: videoFilePath } = await videoDownloader.download(s3Key);
    // Reports the extraction's own 0-100 progress live, same pattern as the
    // gateway-api's yt-dlp download progress — publish-only (no DB write per
    // tick) so a long transcode doesn't sit on a static "10%" for minutes.
    const audio = await audioExtractor.extract(videoFilePath, (percent) => {
      void this.publishProgress(videoId, userId, VideoStatus.PROCESSING_AUDIO, percent);
    });
    await videoRepository.saveDuration(videoId, audio.durationSeconds);

    await this.updateStatus(videoId, userId, VideoStatus.TRANSCRIBING, 30);

    const chunks: TranscribedChunk[] =
      audio.sizeBytes > WHISPER_MAX_BYTES
        ? await this.transcribeInChunks(videoId, userId, audio, audioSplitter, transcriptionProvider, logger)
        : [
            {
              offsetSeconds: 0,
              ...(await transcriptionProvider.transcribe(audio.audioFilePath)),
            },
          ];

    const merged = mergeTranscribedChunks(chunks);

    // The transcript itself must match the user's requested language too, not
    // just the AI summary — Whisper only transcribes in the spoken language,
    // so anything that doesn't already match gets machine-translated here.
    const detectedLanguage = chunks[0]?.language ?? "";
    const finalSegments = needsTranslation(detectedLanguage, summaryLanguage)
      ? await transcriptTranslator.translateSegments(merged.segments, summaryLanguage)
      : merged.segments;
    const finalText = finalSegments.map((segment) => segment.text).join(" ");

    await videoRepository.saveTranscript(videoId, finalText, finalSegments);
    await this.updateStatus(videoId, userId, VideoStatus.ANALYZING_AI, 60);

    return { videoId, userId, transcript: finalText, segments: finalSegments, summaryLanguage };
  }

  private async transcribeInChunks(
    videoId: string,
    userId: string,
    audio: { audioFilePath: string; durationSeconds: number; sizeBytes: number },
    audioSplitter: AudioSplitterPort,
    transcriptionProvider: TranscriptionProviderPort,
    logger: Logger,
  ): Promise<TranscribedChunk[]> {
    logger.info(
      { sizeBytes: audio.sizeBytes },
      "Audio exceeds Whisper's 25MB limit, splitting into chunks",
    );

    const chunkFiles = await audioSplitter.split({
      audioFilePath: audio.audioFilePath,
      durationSeconds: audio.durationSeconds,
      sizeBytes: audio.sizeBytes,
      maxBytesPerChunk: CHUNK_SIZE_BUDGET_BYTES,
    });

    const limit = pLimit(MAX_CONCURRENT_TRANSCRIPTIONS);
    // Whisper has no partial-progress signal within a single chunk request,
    // so completed/total chunk count is the best real progress available —
    // still far better than sitting frozen on a flat 30% for every chunk's
    // whole request duration.
    let completedChunks = 0;

    return Promise.all(
      chunkFiles.map((chunk) =>
        limit(async () => {
          const result = await transcriptionProvider.transcribe(chunk.filePath);
          completedChunks += 1;
          const percent = Math.round((completedChunks / chunkFiles.length) * 100);
          void this.publishProgress(videoId, userId, VideoStatus.TRANSCRIBING, percent);
          return { offsetSeconds: chunk.offsetSeconds, ...result };
        }),
      ),
    );
  }

  private async updateStatus(
    videoId: string,
    userId: string,
    status: VideoStatus,
    progress: number,
  ): Promise<void> {
    await this.deps.videoRepository.updateStatus(videoId, status, progress);
    await this.deps.statusPublisher.publish({ videoId, userId, status, progress });
  }

  /**
   * Live progress ticks within a stage (ffmpeg percent, chunk completion)
   * are published for the UI only — persisting every tick to Postgres would
   * mean dozens of writes per video for no one who isn't watching right now.
   * The stage's DB row keeps whatever checkpoint value updateStatus() set.
   */
  private async publishProgress(
    videoId: string,
    userId: string,
    status: VideoStatus,
    progress: number,
  ): Promise<void> {
    await this.deps.statusPublisher.publish({ videoId, userId, status, progress });
  }
}
