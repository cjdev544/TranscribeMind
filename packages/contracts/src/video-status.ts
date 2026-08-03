export const VideoStatus = {
  QUEUED: "QUEUED",
  PROCESSING_AUDIO: "PROCESSING_AUDIO",
  TRANSCRIBING: "TRANSCRIBING",
  ANALYZING_AI: "ANALYZING_AI",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

export type VideoStatus = (typeof VideoStatus)[keyof typeof VideoStatus];

/**
 * Defines which statuses are a legal predecessor of a given status.
 * Used by domain entities to guard against out-of-order or duplicate
 * status transitions arriving from retried/duplicate queue jobs.
 */
export const VIDEO_STATUS_PREDECESSORS: Record<VideoStatus, VideoStatus[]> = {
  [VideoStatus.QUEUED]: [],
  [VideoStatus.PROCESSING_AUDIO]: [VideoStatus.QUEUED],
  [VideoStatus.TRANSCRIBING]: [VideoStatus.PROCESSING_AUDIO],
  [VideoStatus.ANALYZING_AI]: [VideoStatus.TRANSCRIBING],
  [VideoStatus.COMPLETED]: [VideoStatus.ANALYZING_AI],
  [VideoStatus.FAILED]: [
    VideoStatus.QUEUED,
    VideoStatus.PROCESSING_AUDIO,
    VideoStatus.TRANSCRIBING,
    VideoStatus.ANALYZING_AI,
  ],
};
