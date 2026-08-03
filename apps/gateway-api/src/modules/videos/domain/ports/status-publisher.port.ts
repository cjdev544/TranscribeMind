import type { VideoStatus } from "@transcribemind/contracts";

export interface StatusPublisherPort {
  publish(event: {
    videoId: string;
    userId: string;
    status: VideoStatus;
    progress: number;
    error?: string;
  }): Promise<void>;
}
