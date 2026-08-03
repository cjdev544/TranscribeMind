export const QUEUE_VIDEO_PROCESSING = "video-processing";
export const QUEUE_TRANSCRIPTION_READY = "transcription-ready";

/** Redis Pub/Sub channel used to fan out real-time status updates to the gateway. */
export const VIDEO_EVENTS_CHANNEL = "video-events";

export const BULLMQ_DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: {
    type: "exponential" as const,
    delay: 5_000,
  },
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86_400 },
};

/**
 * Deterministic jobId so retried/duplicate enqueues for the same stage are
 * deduped by BullMQ. BullMQ rejects custom job IDs containing ":" (it's
 * reserved for Redis key namespacing internally), so "-" is used instead.
 */
export function buildJobId(videoId: string, stage: string): string {
  return `${stage}-${videoId}`;
}
