import { Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card.js";
import { cn } from "../../../shared/lib/cn.js";
import { VideoStatusValues, type VideoStatus } from "../../../shared/types/video.js";

const STEPS: { status: VideoStatus; label: string }[] = [
  { status: VideoStatusValues.QUEUED, label: "En cola" },
  { status: VideoStatusValues.PROCESSING_AUDIO, label: "Extrayendo audio" },
  { status: VideoStatusValues.TRANSCRIBING, label: "Transcribiendo" },
  { status: VideoStatusValues.ANALYZING_AI, label: "Analizando con IA" },
  { status: VideoStatusValues.COMPLETED, label: "Completado" },
];

function stepIndex(status: VideoStatus): number {
  return STEPS.findIndex((step) => step.status === status);
}

// Steps whose backend actually reports live intra-stage progress (see
// upload-video-from-url.use-case.ts and process-video.use-case.ts). Other
// statuses (ANALYZING_AI) are a single opaque API call with no partial
// signal to show, so they stay a plain spinner.
const PROGRESS_CAPABLE_STATUSES = new Set<VideoStatus>([
  VideoStatusValues.QUEUED,
  VideoStatusValues.PROCESSING_AUDIO,
  VideoStatusValues.TRANSCRIBING,
]);

const LONG_STEP_HINTS: Partial<Record<VideoStatus, string>> = {
  [VideoStatusValues.QUEUED]: "Los videos largos pueden tardar varios minutos en descargarse.",
  [VideoStatusValues.PROCESSING_AUDIO]: "Los videos largos pueden tardar varios minutos en esta etapa.",
  [VideoStatusValues.TRANSCRIBING]: "Los videos largos pueden tardar varios minutos en transcribirse.",
};

export function ProcessingStepsCard({ status, progress }: { status: VideoStatus; progress?: number }) {
  const currentIndex = stepIndex(status);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Procesando video</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {STEPS.map((step, index) => {
          const isDone = index < currentIndex || status === VideoStatusValues.COMPLETED;
          const isActive = index === currentIndex && status !== VideoStatusValues.COMPLETED;
          const showProgress =
            isActive && PROGRESS_CAPABLE_STATUSES.has(step.status) && typeof progress === "number" && progress > 0;

          return (
            <div key={step.status} className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border text-xs",
                    isDone && "border-success bg-success/10 text-success",
                    isActive && "border-primary bg-primary/10 text-primary",
                    !isDone && !isActive && "border-border text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : isActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : index + 1}
                </div>
                <span className={cn("text-sm", !isDone && !isActive && "text-muted-foreground")}>
                  {showProgress ? `${step.label} (${progress}%)` : step.label}
                </span>
              </div>
              {showProgress && LONG_STEP_HINTS[step.status] && (
                <p className="pl-9 text-xs text-muted-foreground">{LONG_STEP_HINTS[step.status]}</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
