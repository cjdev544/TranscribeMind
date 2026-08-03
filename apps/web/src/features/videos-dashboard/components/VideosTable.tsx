import { FileVideo } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/ui/table.js";
import { StatusBadge } from "./StatusBadge.js";
import { formatDate, formatTimestamp } from "../../../shared/lib/format.js";
import { DeleteVideoDialog } from "../../video-results/components/DeleteVideoDialog.js";
import type { Video } from "../../../shared/types/video.js";

export function VideosTable({ videos, isLoading }: { videos: Video[]; isLoading: boolean }) {
  const [, setSearchParams] = useSearchParams();

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Cargando videos...</p>;
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-16 text-center text-muted-foreground">
        <FileVideo className="h-8 w-8" />
        <p className="text-sm">Todavía no has subido ningún video.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Duración</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {videos.map((video) => (
          <TableRow
            key={video.id}
            className="cursor-pointer"
            onClick={() => setSearchParams({ video: video.id })}
          >
            <TableCell className="font-medium">{video.title ?? video.originalFilename}</TableCell>
            <TableCell className="text-muted-foreground">
              {video.durationSeconds != null ? formatTimestamp(video.durationSeconds) : "—"}
            </TableCell>
            <TableCell>
              <StatusBadge status={video.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(video.createdAt)}</TableCell>
            <TableCell onClick={(event) => event.stopPropagation()}>
              <DeleteVideoDialog videoId={video.id} videoTitle={video.title ?? video.originalFilename} onDeleted={() => {}} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
