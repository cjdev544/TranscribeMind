import { useState, type FormEvent } from "react";
import { Link2, Loader2 } from "lucide-react";
import type { SummaryLanguage } from "@transcribemind/contracts";
import { Input } from "../../../shared/ui/input.js";
import { Button } from "../../../shared/ui/button.js";
import { useUploadVideoFromUrl } from "../api/use-upload-video-from-url.js";

export function UrlUploadForm({
  title,
  summaryLanguage,
  onUploaded,
}: {
  title: string;
  summaryLanguage: SummaryLanguage;
  onUploaded: (videoId: string) => void;
}) {
  const [url, setUrl] = useState("");
  const upload = useUploadVideoFromUrl();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!url.trim()) return;
    upload.mutate({ url: url.trim(), title, summaryLanguage }, { onSuccess: (result) => onUploaded(result.id) });
  };

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-6 text-center">
      <Link2 className="h-8 w-8 text-muted-foreground" />
      <form className="flex w-full max-w-sm gap-2" onSubmit={handleSubmit}>
        <Input
          type="url"
          placeholder="https://youtube.com/watch?v=... o enlace directo a video.mp4"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          disabled={upload.isPending}
          required
        />
        <Button type="submit" disabled={upload.isPending}>
          {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subir"}
        </Button>
      </form>
      {upload.isPending && (
        <p className="text-xs text-muted-foreground">
          Descargando el video desde la URL, esto puede tardar según su tamaño...
        </p>
      )}
      {upload.isError && (
        <p className="max-w-sm text-xs text-destructive">
          {(upload.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "No se pudo descargar el video desde esa URL."}
        </p>
      )}
    </div>
  );
}
