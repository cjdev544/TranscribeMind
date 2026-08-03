import type { Chapter, SummaryAnalysis, TranscriptSegment, VideoStatus } from "@transcribemind/contracts";

export type { Chapter, SummaryAnalysis, TranscriptSegment, VideoStatus };
export type { VideoStatusEvent } from "@transcribemind/contracts";
export { VideoStatus as VideoStatusValues, WS_EVENT_VIDEO_STATUS } from "@transcribemind/contracts";

/** Mirrors the JSON shape returned by GET /api/videos and GET /api/videos/:id on gateway-api. */
export interface Video {
  id: string;
  userId: string;
  title: string | null;
  originalFilename: string;
  s3Key: string;
  status: VideoStatus;
  progress: number;
  durationSeconds: number | null;
  transcript: string | null;
  transcriptSegments: TranscriptSegment[] | null;
  analysis: SummaryAnalysis | null;
  error: string | null;
  completedAt: string | null;
  fileDeletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
