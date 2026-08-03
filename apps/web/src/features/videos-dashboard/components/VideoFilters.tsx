import { Search } from "lucide-react";
import { Input } from "../../../shared/ui/input.js";
import { Button } from "../../../shared/ui/button.js";
import { cn } from "../../../shared/lib/cn.js";
import { VideoStatusValues, type VideoStatus } from "../../../shared/types/video.js";

const STATUS_FILTERS: { label: string; value: VideoStatus | undefined }[] = [
  { label: "Todos", value: undefined },
  { label: "Completados", value: VideoStatusValues.COMPLETED },
  { label: "Procesando", value: VideoStatusValues.PROCESSING_AUDIO },
  { label: "Fallidos", value: VideoStatusValues.FAILED },
];

export function VideoFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: VideoStatus | undefined;
  onStatusChange: (value: VideoStatus | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="flex gap-1">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.label}
            size="sm"
            variant={status === filter.value ? "secondary" : "ghost"}
            className={cn(status === filter.value && "border border-border")}
            onClick={() => onStatusChange(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
