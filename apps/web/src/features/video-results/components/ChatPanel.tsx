import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { Input } from "../../../shared/ui/input.js";
import { Button } from "../../../shared/ui/button.js";
import { cn } from "../../../shared/lib/cn.js";
import { useAskVideo, type ChatMessage } from "../api/use-ask-video.js";

export function ChatPanel({ videoId }: { videoId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const ask = useAskVideo(videoId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, ask.isPending]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || ask.isPending) return;

    const history = messages;
    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setQuestion("");

    ask.mutate(
      { question: trimmed, history },
      {
        onSuccess: (answer) => {
          setMessages((current) => [...current, { role: "assistant", content: answer }]);
        },
      },
    );
  };

  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border border-border bg-card/40 p-3">
      <div ref={scrollRef} className="flex-1 overflow-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <MessageCircle className="h-6 w-6" />
            <p>Pregunta lo que quieras sobre el contenido de este video.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                  message.role === "user"
                    ? "ml-auto bg-primary/10 text-foreground"
                    : "mr-auto bg-muted text-foreground/90",
                )}
              >
                {message.content}
              </div>
            ))}
            {ask.isPending && (
              <div className="mr-auto flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Pensando...
              </div>
            )}
          </div>
        )}
      </div>

      {ask.isError && (
        <p className="text-xs text-destructive">
          {(ask.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "No se pudo obtener una respuesta. Intenta de nuevo."}
        </p>
      )}

      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Escribe tu pregunta..."
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={ask.isPending}
          maxLength={1000}
        />
        <Button type="submit" size="icon" disabled={ask.isPending || !question.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
