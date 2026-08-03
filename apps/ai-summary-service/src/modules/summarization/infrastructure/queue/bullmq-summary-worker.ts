import { Worker, type Job } from "bullmq";
import type { Redis } from "ioredis";
import { QUEUE_TRANSCRIPTION_READY, VideoStatus, type TranscriptionReadyJob } from "@transcribemind/contracts";
import type { Logger } from "@transcribemind/logger";
import type { GenerateSummaryUseCase } from "../../application/generate-summary.use-case.js";
import type { StatusPublisherPort } from "../../domain/ports/status-publisher.port.js";
import type { VideoRepositoryPort } from "../../domain/ports/video-repository.port.js";

/**
 * Job failures surface here as raw OpenAI SDK exception messages — not
 * meaningful to a user deciding whether to retry. The original is still
 * captured by the logger.error() call right above each use of this.
 */
function humanizeSummaryError(rawMessage: string): string {
  if (/rate limit/i.test(rawMessage)) {
    return "El servicio de IA está saturado en este momento. Intenta de nuevo en unos minutos.";
  }
  if (/insufficient_quota|exceeded your current quota/i.test(rawMessage)) {
    return "Se alcanzó el límite de uso del servicio de IA configurado. Contacta al administrador.";
  }
  if (/context_length_exceeded|maximum context length/i.test(rawMessage)) {
    return "La transcripción es demasiado larga para generar el resumen. Prueba con un video más corto.";
  }
  if (/econnreset|etimedout|enotfound|network/i.test(rawMessage)) {
    return "Hubo un problema de red al generar el resumen. Intenta de nuevo.";
  }
  return "Ocurrió un error inesperado al generar el resumen. Intenta de nuevo — si el problema persiste, probablemente sea temporal.";
}

export function createSummaryWorker(
  connection: Redis,
  generateSummaryUseCase: GenerateSummaryUseCase,
  statusPublisher: StatusPublisherPort,
  videoRepository: VideoRepositoryPort,
  logger: Logger,
): Worker<TranscriptionReadyJob> {
  const worker = new Worker<TranscriptionReadyJob>(
    QUEUE_TRANSCRIPTION_READY,
    async (job: Job<TranscriptionReadyJob>) => {
      await generateSummaryUseCase.execute(job.data);
    },
    { connection, concurrency: 5 },
  );

  worker.on("failed", async (job, error) => {
    if (!job) return;
    logger.error({ err: error, jobId: job.id, attemptsMade: job.attemptsMade }, "Summary generation job failed");

    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      const message = humanizeSummaryError(error.message);
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
