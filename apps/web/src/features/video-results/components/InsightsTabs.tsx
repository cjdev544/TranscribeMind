import { ListVideo, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../shared/ui/tabs.js";
import { Badge } from "../../../shared/ui/badge.js";
import { ChatPanel } from "./ChatPanel.js";
import { formatTimestamp } from "../../../shared/lib/format.js";
import type { SummaryAnalysis } from "../../../shared/types/video.js";

export function InsightsTabs({
  videoId,
  analysis,
  onSeek,
}: {
  videoId: string;
  analysis: SummaryAnalysis;
  /** Omitted when there's no player to control (e.g. no source file to play back). */
  onSeek?: (seconds: number) => void;
}) {
  const chapters = analysis.chapters ?? [];

  return (
    <Tabs defaultValue="summary" className="flex h-full flex-col">
      <TabsList>
        <TabsTrigger value="summary">Resumen</TabsTrigger>
        <TabsTrigger value="keypoints">Puntos clave</TabsTrigger>
        {chapters.length > 0 && <TabsTrigger value="chapters">Capítulos</TabsTrigger>}
        <TabsTrigger value="keywords">Keywords</TabsTrigger>
        <TabsTrigger value="chat">Preguntas</TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="flex-1 overflow-auto rounded-lg border border-border bg-card/40 p-4">
        <p className="text-sm leading-relaxed text-foreground/90">{analysis.executiveSummary}</p>
      </TabsContent>

      <TabsContent value="keypoints" className="flex-1 overflow-auto rounded-lg border border-border bg-card/40 p-4">
        <ul className="flex flex-col gap-2">
          {analysis.keyPoints.map((point, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-foreground/90">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {point}
            </li>
          ))}
        </ul>
      </TabsContent>

      {chapters.length > 0 && (
        <TabsContent value="chapters" className="flex-1 overflow-auto rounded-lg border border-border bg-card/40 p-4">
          <ul className="flex flex-col gap-1">
            {chapters.map((chapter, index) => (
              <li key={index}>
                <button
                  type="button"
                  disabled={!onSeek}
                  onClick={() => onSeek?.(chapter.startSeconds)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm text-foreground/90 enabled:hover:bg-accent enabled:cursor-pointer"
                >
                  <ListVideo className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="shrink-0 font-mono text-xs text-primary">
                    {formatTimestamp(chapter.startSeconds)}
                  </span>
                  <span>{chapter.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </TabsContent>
      )}

      <TabsContent value="keywords" className="flex-1 overflow-auto rounded-lg border border-border bg-card/40 p-4">
        <div className="flex flex-wrap gap-2">
          {analysis.keywords.map((keyword) => (
            <Badge key={keyword} variant="outline">
              {keyword}
            </Badge>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="chat" className="flex-1 overflow-hidden">
        <ChatPanel videoId={videoId} />
      </TabsContent>
    </Tabs>
  );
}
