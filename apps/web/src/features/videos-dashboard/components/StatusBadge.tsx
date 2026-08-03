import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "../../../shared/ui/badge.js";
import { VideoStatusValues, type VideoStatus } from "../../../shared/types/video.js";

const STATUS_CONFIG: Record<VideoStatus, { label: string; variant: "default" | "success" | "warning" | "destructive"; icon: typeof Clock }> = {
  [VideoStatusValues.QUEUED]: { label: "En cola", variant: "default", icon: Clock },
  [VideoStatusValues.PROCESSING_AUDIO]: { label: "Extrayendo audio", variant: "warning", icon: Loader2 },
  [VideoStatusValues.TRANSCRIBING]: { label: "Transcribiendo", variant: "warning", icon: Loader2 },
  [VideoStatusValues.ANALYZING_AI]: { label: "Analizando IA", variant: "warning", icon: Loader2 },
  [VideoStatusValues.COMPLETED]: { label: "Completado", variant: "success", icon: CheckCircle2 },
  [VideoStatusValues.FAILED]: { label: "Fallido", variant: "destructive", icon: XCircle },
};

const PROCESSING_STATUSES = new Set<VideoStatus>([
  VideoStatusValues.QUEUED,
  VideoStatusValues.PROCESSING_AUDIO,
  VideoStatusValues.TRANSCRIBING,
  VideoStatusValues.ANALYZING_AI,
]);

export function StatusBadge({ status }: { status: VideoStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const isSpinning = PROCESSING_STATUSES.has(status);

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className={isSpinning ? "h-3 w-3 animate-spin" : "h-3 w-3"} />
      {config.label}
    </Badge>
  );
}
