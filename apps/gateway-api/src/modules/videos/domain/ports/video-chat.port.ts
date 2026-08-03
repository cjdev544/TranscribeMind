import type { SummaryLanguage, TranscriptSegment } from "@transcribemind/contracts";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface VideoChatPort {
  ask(input: {
    segments: TranscriptSegment[];
    language: SummaryLanguage;
    question: string;
    history: ChatMessage[];
  }): Promise<string>;
}
