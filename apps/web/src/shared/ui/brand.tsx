import { Sparkles } from "lucide-react";
import { cn } from "../lib/cn.js";

export function Brand({ className, size = "default" }: { className?: string; size?: "default" | "sm" }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Sparkles className={cn("text-primary", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
      <span className={cn("font-semibold tracking-tight", size === "sm" ? "text-sm" : "text-xl")}>
        TranscribeMind
      </span>
    </div>
  );
}
