import { z } from "zod";
import { DEFAULT_SUMMARY_LANGUAGE, SummaryLanguage } from "./summary-language.js";

export const transcriptSegmentSchema = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string(),
});

export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>;

/** Payload enqueued by gateway-api onto QUEUE_VIDEO_PROCESSING. */
export const videoProcessingJobSchema = z.object({
  videoId: z.string().uuid(),
  userId: z.string().uuid(),
  s3Key: z.string(),
  // Carried through unused by video-worker itself, just forwarded into the
  // TranscriptionReadyJob so ai-summary-service knows what language to write in.
  summaryLanguage: z.nativeEnum(SummaryLanguage).default(DEFAULT_SUMMARY_LANGUAGE),
});

export type VideoProcessingJob = z.infer<typeof videoProcessingJobSchema>;

/** Payload enqueued by video-worker onto QUEUE_TRANSCRIPTION_READY. */
export const transcriptionReadyJobSchema = z.object({
  videoId: z.string().uuid(),
  userId: z.string().uuid(),
  transcript: z.string(),
  segments: z.array(transcriptSegmentSchema),
  summaryLanguage: z.nativeEnum(SummaryLanguage).default(DEFAULT_SUMMARY_LANGUAGE),
});

export type TranscriptionReadyJob = z.infer<typeof transcriptionReadyJobSchema>;
