import {
  VIDEO_STATUS_PREDECESSORS,
  VideoStatus,
  type SummaryAnalysis,
  type SummaryLanguage,
  type TranscriptSegment,
} from "@transcribemind/contracts";

export interface Video {
  readonly id: string;
  readonly userId: string;
  readonly title: string | null;
  readonly originalFilename: string;
  readonly s3Key: string;
  readonly summaryLanguage: SummaryLanguage;
  readonly status: VideoStatus;
  readonly progress: number;
  readonly durationSeconds: number | null;
  readonly transcript: string | null;
  readonly transcriptSegments: TranscriptSegment[] | null;
  readonly analysis: SummaryAnalysis | null;
  readonly error: string | null;
  readonly completedAt: Date | null;
  readonly fileDeletedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Guards against out-of-order status transitions caused by retried or
 * duplicate queue jobs (e.g. a stale "TRANSCRIBING" message arriving after
 * the video already reached "COMPLETED").
 */
export function canTransitionTo(current: VideoStatus, next: VideoStatus): boolean {
  if (next === VideoStatus.FAILED) {
    return true;
  }
  return VIDEO_STATUS_PREDECESSORS[next].includes(current);
}
