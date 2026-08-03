import { Queue } from "bullmq";
import type { Redis } from "ioredis";
import {
  BULLMQ_DEFAULT_JOB_OPTIONS,
  QUEUE_VIDEO_PROCESSING,
  buildJobId,
  type VideoProcessingJob,
} from "@transcribemind/contracts";
import type { JobQueuePort } from "../../domain/ports/job-queue.port.js";

export class BullMqJobQueueAdapter implements JobQueuePort {
  private readonly videoProcessingQueue: Queue<VideoProcessingJob>;

  constructor(connection: Redis) {
    this.videoProcessingQueue = new Queue<VideoProcessingJob>(QUEUE_VIDEO_PROCESSING, {
      connection,
    });
  }

  async enqueueVideoProcessing(job: VideoProcessingJob): Promise<void> {
    const jobId = buildJobId(job.videoId, QUEUE_VIDEO_PROCESSING);

    // A retry re-enqueues the same videoId/stage jobId. BullMQ keeps
    // completed/failed jobs around for removeOnFail/removeOnComplete's
    // retention window, so the old terminal job must be cleared first or
    // the new attempt would be silently ignored as a duplicate.
    const existingJob = await this.videoProcessingQueue.getJob(jobId);
    if (existingJob) {
      await existingJob.remove();
    }

    await this.videoProcessingQueue.add(QUEUE_VIDEO_PROCESSING, job, {
      ...BULLMQ_DEFAULT_JOB_OPTIONS,
      jobId,
    });
  }
}
