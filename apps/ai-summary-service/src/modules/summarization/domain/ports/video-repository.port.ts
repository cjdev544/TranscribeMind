import type { Summary } from "../summary.entity.js";

export interface VideoRepositoryPort {
  saveAnalysis(videoId: string, analysis: Summary): Promise<void>;
  markFailed(videoId: string, error: string): Promise<void>;
}
