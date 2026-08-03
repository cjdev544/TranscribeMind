import type { TranscriptSegment, VideoStatus } from "@transcribemind/contracts";

export interface VideoRecord {
  readonly id: string;
  readonly userId: string;
  readonly s3Key: string;
  readonly status: VideoStatus;
}

export interface VideoStatusRepositoryPort {
  findById(videoId: string): Promise<VideoRecord | null>;
  updateStatus(videoId: string, status: VideoStatus, progress: number): Promise<void>;
  saveDuration(videoId: string, durationSeconds: number): Promise<void>;
  saveTranscript(videoId: string, transcript: string, segments: TranscriptSegment[]): Promise<void>;
  markFailed(videoId: string, error: string): Promise<void>;
}
