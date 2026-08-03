import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "../../../shared/ui/button.js";

export function ErrorState({
  message,
  onRetry,
  isRetrying,
}: {
  message: string | null;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="text-sm font-medium">El procesamiento falló</p>
      <p className="max-w-md text-sm text-muted-foreground">{message ?? "Ocurrió un error inesperado."}</p>
      <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
        <RotateCcw className="h-3.5 w-3.5" />
        {isRetrying ? "Reintentando..." : "Reintentar"}
      </Button>
    </div>
  );
}
