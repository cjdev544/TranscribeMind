import { create } from "zustand";
import type { VideoStatus } from "../shared/types/video.js";

export interface RealtimeVideoState {
  status: VideoStatus;
  progress: number;
  error?: string;
}

interface RealtimeStore {
  byVideoId: Record<string, RealtimeVideoState>;
  setVideoState: (videoId: string, state: RealtimeVideoState) => void;
}

export const useRealtimeStore = create<RealtimeStore>((set) => ({
  byVideoId: {},
  setVideoState: (videoId, state) =>
    set((current) => ({ byVideoId: { ...current.byVideoId, [videoId]: state } })),
}));
