import { z } from "zod";
import { VideoStatus } from "./video-status.js";

/** Published to Redis Pub/Sub on VIDEO_EVENTS_CHANNEL by any worker, consumed only by gateway-api. */
export const videoStatusEventSchema = z.object({
  videoId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.nativeEnum(VideoStatus),
  progress: z.number().min(0).max(100),
  error: z.string().optional(),
});

export type VideoStatusEvent = z.infer<typeof videoStatusEventSchema>;

/** Socket.io event name the client subscribes to. */
export const WS_EVENT_VIDEO_STATUS = "video_status";

export const chapterSchema = z.object({
  title: z.string(),
  startSeconds: z.number(),
});

export type Chapter = z.infer<typeof chapterSchema>;

export const summaryAnalysisSchema = z.object({
  executiveSummary: z.string(),
  keyPoints: z.array(z.string()),
  keywords: z.array(z.string()),
  // Optional: older analyses generated before chapters existed won't have
  // this key at all, and reads aren't re-validated against this schema, so
  // consumers must treat a missing value the same as an empty list.
  chapters: z.array(chapterSchema).optional(),
});

export type SummaryAnalysis = z.infer<typeof summaryAnalysisSchema>;
