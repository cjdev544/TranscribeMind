import { HardDriveDownload } from "lucide-react";
import { Button } from "../../../shared/ui/button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../shared/ui/dialog.js";
import { useFreeUpVideoSpace } from "../api/use-free-up-video-space.js";

export function FreeUpSpaceDialog({ videoId }: { videoId: string }) {
  const freeUpSpace = useFreeUpVideoSpace(videoId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Liberar espacio" onClick={(event) => event.stopPropagation()}>
          <HardDriveDownload className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Liberar espacio</DialogTitle>
          <DialogDescription>
            Esto elimina el archivo de video original para ahorrar espacio de almacenamiento. La transcripción, el
            resumen, los puntos clave y los capítulos se conservan — solo dejarás de poder reproducir el video. Esta
            acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="destructive" disabled={freeUpSpace.isPending} onClick={() => freeUpSpace.mutate()}>
            {freeUpSpace.isPending ? "Liberando..." : "Liberar espacio"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
