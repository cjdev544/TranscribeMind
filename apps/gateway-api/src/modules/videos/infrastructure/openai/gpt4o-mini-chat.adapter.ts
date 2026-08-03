import OpenAI from "openai";
import { SummaryLanguage, type TranscriptSegment } from "@transcribemind/contracts";
import type { ChatMessage, VideoChatPort } from "../../domain/ports/video-chat.port.js";

const LANGUAGE_NAMES: Record<SummaryLanguage, string> = {
  [SummaryLanguage.ES]: "Spanish (español)",
  [SummaryLanguage.EN]: "English",
  [SummaryLanguage.DE]: "German (Deutsch)",
};

function buildSystemPrompt(language: SummaryLanguage, segments: TranscriptSegment[]): string {
  const languageName = LANGUAGE_NAMES[language];
  const transcript = segments.map((segment) => `[${Math.round(segment.start)}s] ${segment.text}`).join("\n");

  return `You answer questions about a specific video using ONLY the transcript below — you were not shown \
the video itself and have no outside knowledge of it. The transcript's "[Ns]" tags are each line's start time \
in seconds.

Rules:
- Answer strictly from the transcript's content. If the answer isn't in there, say so plainly instead of \
guessing or filling gaps with outside knowledge — a wrong confident answer is worse than "no se menciona eso \
en el video".
- When it helps the person find the moment themselves, reference the approximate timestamp in minutes:seconds \
(derived from the nearest "[Ns]" tag), e.g. "alrededor del minuto 2:30".
- Keep answers concise and direct — a few sentences unless the question genuinely calls for more.
- Answer entirely in ${languageName}, regardless of the transcript's own language.

Transcript:
${transcript}`;
}

export class Gpt4oMiniChatAdapter implements VideoChatPort {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async ask(input: {
    segments: TranscriptSegment[];
    language: SummaryLanguage;
    question: string;
    history: ChatMessage[];
  }): Promise<string> {
    const response = await this.client.chat.completions.create({
      // Chat is interactive and can be fired many times per session, unlike
      // the one-shot summary/chapters generation — mini keeps repeated
      // follow-up questions cheap while still being grounded in the same
      // transcript context.
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildSystemPrompt(input.language, input.segments) },
        ...input.history.map((message) => ({ role: message.role, content: message.content })),
        { role: "user", content: input.question },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("GPT-4o-mini returned an empty response");
    }

    return content;
  }
}
