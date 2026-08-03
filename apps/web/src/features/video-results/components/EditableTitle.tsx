import { useState, type KeyboardEvent } from "react";
import { Pencil } from "lucide-react";
import { Input } from "../../../shared/ui/input.js";
import { useUpdateVideoTitle } from "../api/use-update-video-title.js";
import type { Video } from "../../../shared/types/video.js";

export function EditableTitle({ video }: { video: Video }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(video.title ?? video.originalFilename);
  const updateTitle = useUpdateVideoTitle(video.id);

  const displayTitle = video.title ?? video.originalFilename;

  const commit = () => {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (trimmed === displayTitle || trimmed === (video.title ?? "")) return;
    updateTitle.mutate(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") commit();
    if (event.key === "Escape") {
      setDraft(displayTitle);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        maxLength={200}
        className="text-lg font-semibold"
      />
    );
  }

  return (
    <button
      type="button"
      className="group flex items-center gap-2 truncate text-left text-lg font-semibold"
      onClick={() => {
        setDraft(displayTitle);
        setIsEditing(true);
      }}
      title="Editar título"
    >
      <span className="truncate">{displayTitle}</span>
      <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
