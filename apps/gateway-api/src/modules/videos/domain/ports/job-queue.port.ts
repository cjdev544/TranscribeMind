import type { VideoProcessingJob } from "@transcribemind/contracts";

export interface JobQueuePort {
  enqueueVideoProcessing(job: VideoProcessingJob): Promise<void>;
}
