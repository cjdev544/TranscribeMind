import type { SummaryLanguage, TranscriptSegment } from "@transcribemind/contracts";
import type { Summary } from "../summary.entity.js";

export interface SummaryProviderPort {
  /** Segments (not just flat text) so the provider can ground chapter timestamps in the real timeline. */
  summarize(segments: TranscriptSegment[], language: SummaryLanguage): Promise<Summary>;
}
