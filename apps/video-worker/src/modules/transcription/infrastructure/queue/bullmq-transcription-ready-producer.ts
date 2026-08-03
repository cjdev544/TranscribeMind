import { Queue } from "bullmq";
import type { Redis } from "ioredis";
import {
  BULLMQ_DEFAULT_JOB_OPTIONS,
  QUEUE_TRANSCRIPTION_READY,
  buildJobId,
  type TranscriptionReadyJob,
} from "@transcribemind/contracts";

export class BullMqTranscriptionReadyProducer {
  private readonly queue: Queue<TranscriptionReadyJob>;

  constructor(connection: Redis) {
    this.queue = new Queue<TranscriptionReadyJob>(QUEUE_TRANSCRIPTION_READY, { connection });
  }

  async enqueue(job: TranscriptionReadyJob): Promise<void> {
    await this.queue.add(QUEUE_TRANSCRIPTION_READY, job, {
      ...BULLMQ_DEFAULT_JOB_OPTIONS,
      jobId: buildJobId(job.videoId, QUEUE_TRANSCRIPTION_READY),
    });
  }
}
