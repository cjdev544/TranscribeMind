import { formatTimestamp } from "../../../shared/lib/format.js";
import type { TranscriptSegment } from "../../../shared/types/video.js";

export function TranscriptPanel({
  transcript,
  segments,
  onSeek,
}: {
  transcript: string;
  segments: TranscriptSegment[] | null;
  /** Omitted when there's no player to control (e.g. no source file to play back). */
  onSeek?: (seconds: number) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <h2 className="text-sm font-semibold text-muted-foreground">Transcripción</h2>
      <div className="flex-1 overflow-auto rounded-lg border border-border bg-card/40 p-4">
        {segments && segments.length > 0 ? (
          <div className="flex flex-col gap-3">
            {segments.map((segment, index) => (
              <div key={index} className="flex gap-3 text-sm">
                <button
                  type="button"
                  disabled={!onSeek}
                  onClick={() => onSeek?.(segment.start)}
                  className="shrink-0 font-mono text-xs text-primary enabled:cursor-pointer enabled:hover:underline"
                >
                  {formatTimestamp(segment.start)}
                </button>
                <p className="text-foreground/90">{segment.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{transcript}</p>
        )}
      </div>
    </div>
  );
}
