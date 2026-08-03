import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Clapperboard } from "lucide-react";
import { Button } from "../../shared/ui/button.js";
import { cn } from "../../shared/lib/cn.js";
import { useVideoQuery } from "./api/use-video-query.js";
import { useRetryVideo } from "./api/use-retry-video.js";
import { TranscriptPanel } from "./components/TranscriptPanel.js";
import { InsightsTabs } from "./components/InsightsTabs.js";
import { VideoPlayer } from "./components/VideoPlayer.js";
import { ExportActions } from "./components/ExportActions.js";
import { ErrorState } from "./components/ErrorState.js";
import { EditableTitle } from "./components/EditableTitle.js";
import { DeleteVideoDialog } from "./components/DeleteVideoDialog.js";
import { FreeUpSpaceDialog } from "./components/FreeUpSpaceDialog.js";
import { ProcessingStepsCard } from "../video-upload/components/ProcessingStepsCard.js";
import { VideoStatusValues } from "../../shared/types/video.js";

export function ResultsPage({ videoId }: { videoId: string }) {
  const navigate = useNavigate();
  const { data: video, isLoading } = useVideoQuery(videoId);
  const retry = useRetryVideo(videoId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);

  const handleSeek = (seconds: number) => {
    // Jumping to a moment implies wanting to watch it — the player stays
    // mounted while collapsed (just hidden) so this always has a ref to act on.
    setIsVideoExpanded(true);
    const player = videoRef.current;
    if (!player) return;
    player.currentTime = seconds;
    void player.play();
  };

  if (isLoading || !video) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Cargando video...</div>;
  }

  const isProcessing =
    video.status !== VideoStatusValues.COMPLETED && video.status !== VideoStatusValues.FAILED;

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex flex-wrap items-center gap-1">
          {video.status === VideoStatusValues.COMPLETED && <ExportActions video={video} />}
          {video.status === VideoStatusValues.COMPLETED && !video.fileDeletedAt && (
            <FreeUpSpaceDialog videoId={video.id} />
          )}
          <DeleteVideoDialog
            videoId={video.id}
            videoTitle={video.title ?? video.originalFilename}
            onDeleted={() => navigate("/dashboard")}
          />
        </div>
      </div>

      <EditableTitle video={video} />

      {isProcessing && (
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <ProcessingStepsCard status={video.status} progress={video.progress} />
          </div>
        </div>
      )}

      {video.status === VideoStatusValues.FAILED && (
        <ErrorState message={video.error} onRetry={() => retry.mutate()} isRetrying={retry.isPending} />
      )}

      {video.status === VideoStatusValues.COMPLETED && video.analysis && (
        <>
          {video.fileDeletedAt ? (
            <p className="rounded-lg border border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground">
              El video original se eliminó para ahorrar espacio. La transcripción, el resumen y los capítulos siguen
              disponibles abajo.
            </p>
          ) : (
            <div className="rounded-lg border border-border bg-card/40">
              <button
                type="button"
                onClick={() => setIsVideoExpanded((expanded) => !expanded)}
                className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <Clapperboard className="h-4 w-4 text-primary" />
                  Video original
                </span>
                {isVideoExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {/* Stays mounted while collapsed (display:none, not unmounted) so playback state and the
                  ref survive toggling — handleSeek can always act on it, even before it's ever been opened. */}
              <div className={cn("px-3 pb-3", !isVideoExpanded && "hidden")}>
                <VideoPlayer ref={videoRef} videoId={video.id} />
              </div>
            </div>
          )}
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] md:overflow-hidden">
            <div className="h-[60vh] md:h-full">
              <TranscriptPanel
                transcript={video.transcript ?? ""}
                segments={video.transcriptSegments}
                onSeek={video.fileDeletedAt ? undefined : handleSeek}
              />
            </div>
            <div className="h-[60vh] md:h-full">
              <InsightsTabs
                videoId={video.id}
                analysis={video.analysis}
                onSeek={video.fileDeletedAt ? undefined : handleSeek}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
