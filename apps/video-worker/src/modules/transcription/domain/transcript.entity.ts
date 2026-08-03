import type { TranscriptSegment } from "@transcribemind/contracts";

export interface TranscribedChunk {
  /** Offset, in seconds, of this chunk's start within the original audio file. */
  readonly offsetSeconds: number;
  readonly text: string;
  readonly segments: TranscriptSegment[];
  readonly language: string;
}

export interface MergedTranscript {
  readonly fullText: string;
  readonly segments: TranscriptSegment[];
}

/**
 * Concatenates per-chunk Whisper results into one coherent transcript.
 * Each chunk's segment timestamps are relative to that chunk's own start,
 * so they're shifted by the chunk's offset within the original audio before
 * being merged — otherwise every chunk after the first would report
 * timestamps starting back at 0.
 */
export function mergeTranscribedChunks(chunks: TranscribedChunk[]): MergedTranscript {
  const orderedChunks = [...chunks].sort((a, b) => a.offsetSeconds - b.offsetSeconds);

  const segments: TranscriptSegment[] = orderedChunks.flatMap((chunk) =>
    chunk.segments.map((segment) => ({
      start: segment.start + chunk.offsetSeconds,
      end: segment.end + chunk.offsetSeconds,
      text: segment.text,
    })),
  );

  const fullText = orderedChunks.map((chunk) => chunk.text.trim()).join(" ");

  return { fullText, segments };
}
