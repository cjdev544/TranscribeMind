import "./shared/ffmpeg-runtime.js";
import { Redis } from "ioredis";
import { createLogger } from "@transcribemind/logger";
import { env } from "./shared/env.js";
import { ProcessVideoUseCase } from "./modules/transcription/application/process-video.use-case.js";
import { S3VideoDownloaderAdapter } from "./modules/transcription/infrastructure/storage/s3-video-downloader.adapter.js";
import { FluentFfmpegAudioExtractor } from "./modules/transcription/infrastructure/ffmpeg/fluent-ffmpeg-audio-extractor.adapter.js";
import { FluentFfmpegAudioSplitter } from "./modules/transcription/infrastructure/ffmpeg/fluent-ffmpeg-audio-splitter.adapter.js";
import { WhisperTranscriptionAdapter } from "./modules/transcription/infrastructure/openai/whisper-transcription.adapter.js";
import { Gpt4oTranscriptTranslatorAdapter } from "./modules/transcription/infrastructure/openai/gpt4o-transcript-translator.adapter.js";
import { RedisStatusPublisherAdapter } from "./modules/transcription/infrastructure/messaging/redis-status-publisher.adapter.js";
import { PrismaVideoRepository } from "./modules/transcription/infrastructure/persistence/prisma-video.repository.js";
import { BullMqTranscriptionReadyProducer } from "./modules/transcription/infrastructure/queue/bullmq-transcription-ready-producer.js";
import { createVideoProcessingWorker } from "./modules/transcription/infrastructure/queue/bullmq-video-worker.js";

const logger = createLogger("video-worker");

async function main(): Promise<void> {
  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const publisherConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

  const s3Config = {
    bucket: env.S3_BUCKET,
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
  };

  const videoRepository = new PrismaVideoRepository();
  const statusPublisher = new RedisStatusPublisherAdapter(publisherConnection);
  const transcriptionReadyProducer = new BullMqTranscriptionReadyProducer(connection);

  const processVideoUseCase = new ProcessVideoUseCase({
    videoDownloader: new S3VideoDownloaderAdapter(s3Config),
    audioExtractor: new FluentFfmpegAudioExtractor(),
    audioSplitter: new FluentFfmpegAudioSplitter(),
    transcriptionProvider: new WhisperTranscriptionAdapter(env.OPENAI_API_KEY),
    transcriptTranslator: new Gpt4oTranscriptTranslatorAdapter(env.OPENAI_API_KEY),
    statusPublisher,
    videoRepository,
    logger,
  });

  createVideoProcessingWorker(
    connection,
    processVideoUseCase,
    transcriptionReadyProducer,
    statusPublisher,
    videoRepository,
    logger,
  );

  logger.info("video-worker listening for jobs");
}

main().catch((error) => {
  logger.error({ err: error }, "Failed to start video-worker");
  process.exit(1);
});
