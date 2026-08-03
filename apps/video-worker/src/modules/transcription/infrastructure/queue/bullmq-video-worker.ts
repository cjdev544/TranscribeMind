import { Worker, type Job } from "bullmq";
import type { Redis } from "ioredis";
import { QUEUE_VIDEO_PROCESSING, VideoStatus, type VideoProcessingJob } from "@transcribemind/contracts";
import type { Logger } from "@transcribemind/logger";
import type { ProcessVideoUseCase } from "../../application/process-video.use-case.js";
import type { BullMqTranscriptionReadyProducer } from "./bullmq-transcription-ready-producer.js";
import type { StatusPublisherPort } from "../../domain/ports/status-publisher.port.js";
import type { VideoStatusRepositoryPort } from "../../domain/ports/video-status-repository.port.js";

/**
 * Job failures surface here as raw exception messages — an OpenAI SDK error,
 * an ffmpeg stderr dump, a bare Node network errno — none of it meaningful
 * to a user deciding whether to retry. The original is still captured by
 * the logger.error() call right above each use of this, just not stored on
 * the video or shown in the UI.
 */
function humanizeProcessingError(rawMessage: string): string {
  if (/rate limit/i.test(rawMessage)) {
    return "El servicio de transcripción está saturado en este momento. Intenta de nuevo en unos minutos.";
  }
  if (/insufficient_quota|exceeded your current quota/i.test(rawMessage)) {
    return "Se alcanzó el límite de uso del servicio de IA configurado. Contacta al administrador.";
  }
  if (/invalid data found when processing input|moov atom not found|could not find codec/i.test(rawMessage)) {
    return "El archivo de video parece estar dañado y no se pudo procesar.";
  }
  if (/econnreset|etimedout|enotfound|network/i.test(rawMessage)) {
    return "Hubo un problema de red al procesar el video. Intenta de nuevo.";
  }
  if (/nosuchkey|no such key|not found/i.test(rawMessage)) {
    return "No se encontró el archivo de video, puede haber sido eliminado antes de completarse el procesamiento.";
  }
  return "Ocurrió un error inesperado al procesar el video. Intenta de nuevo — si el problema persiste, probablemente sea temporal.";
}

export function createVideoProcessingWorker(
  connection: Redis,
  processVideoUseCase: ProcessVideoUseCase,
  transcriptionReadyProducer: BullMqTranscriptionReadyProducer,
  statusPublisher: StatusPublisherPort,
  videoRepository: VideoStatusRepositoryPort,
  logger: Logger,
): Worker<VideoProcessingJob> {
  const worker = new Worker<VideoProcessingJob>(
    QUEUE_VIDEO_PROCESSING,
    async (job: Job<VideoProcessingJob>) => {
      const transcriptionReadyJob = await processVideoUseCase.execute(job.data);
      await transcriptionReadyProducer.enqueue(transcriptionReadyJob);
    },
    { connection, concurrency: 2 },
  );

  worker.on("failed", async (job, error) => {
    if (!job) return;
    logger.error({ err: error, jobId: job.id, attemptsMade: job.attemptsMade }, "Video processing job failed");

    // Only mark the video permanently FAILED once BullMQ has exhausted all
    // retry attempts — earlier failures will be retried with exponential backoff.
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      const message = humanizeProcessingError(error.message);
      await videoRepository.markFailed(job.data.videoId, message);
      await statusPublisher.publish({
        videoId: job.data.videoId,
        userId: job.data.userId,
        status: VideoStatus.FAILED,
        progress: 0,
        error: message,
      });
    }
  });

  return worker;
}
