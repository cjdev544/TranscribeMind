import type { TranscriptSegment } from "@transcribemind/contracts";

export interface TranscriptionProviderPort {
  transcribe(
    audioFilePath: string,
  ): Promise<{ text: string; segments: TranscriptSegment[]; language: string }>;
}
