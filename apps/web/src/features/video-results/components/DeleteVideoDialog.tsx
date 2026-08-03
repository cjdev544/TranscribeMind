import { Trash2 } from "lucide-react";
import { Button } from "../../../shared/ui/button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../shared/ui/dialog.js";
import { useDeleteVideo } from "../api/use-delete-video.js";

export function DeleteVideoDialog({
  videoId,
  videoTitle,
  onDeleted,
}: {
  videoId: string;
  videoTitle: string;
  onDeleted: () => void;
}) {
  const deleteVideo = useDeleteVideo();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Eliminar video" onClick={(event) => event.stopPropagation()}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Eliminar video</DialogTitle>
          <DialogDescription>
            Esto eliminará permanentemente "{videoTitle}", su transcripción, el análisis y el archivo original. Esta
            acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button
            variant="destructive"
            disabled={deleteVideo.isPending}
            onClick={() => deleteVideo.mutate(videoId, { onSuccess: onDeleted })}
          >
            {deleteVideo.isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
