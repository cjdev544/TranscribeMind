import type { SummaryLanguage, TranscriptSegment } from "@transcribemind/contracts";

export interface TranscriptTranslatorPort {
  translateSegments(segments: TranscriptSegment[], targetLanguage: SummaryLanguage): Promise<TranscriptSegment[]>;
}
