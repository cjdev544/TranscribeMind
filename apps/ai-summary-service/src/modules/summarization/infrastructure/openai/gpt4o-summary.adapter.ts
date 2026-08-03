import OpenAI from "openai";
import { summaryAnalysisSchema, SummaryLanguage, type TranscriptSegment } from "@transcribemind/contracts";
import type { SummaryProviderPort } from "../../domain/ports/summary-provider.port.js";
import type { Summary } from "../../domain/summary.entity.js";

const LANGUAGE_NAMES: Record<SummaryLanguage, string> = {
  [SummaryLanguage.ES]: "Spanish (español)",
  [SummaryLanguage.EN]: "English",
  [SummaryLanguage.DE]: "German (Deutsch)",
};

/** Tags each segment with its start time in raw seconds so the model can ground chapters in real timestamps. */
function buildTimestampedTranscript(segments: TranscriptSegment[]): string {
  return segments.map((segment) => `[${Math.round(segment.start)}s] ${segment.text}`).join("\n");
}

function buildSystemPrompt(language: SummaryLanguage): string {
  const languageName = LANGUAGE_NAMES[language];
  return `You are an assistant that turns video transcripts into study notes for someone who will \
never watch the video. They need to walk away understanding the substance as if they had watched it — \
skip anything that doesn't earn its place.

The transcript you receive has each line prefixed with "[Ns]" where N is that line's start time in seconds \
from the beginning of the video (e.g. "[124s] ..." means that line starts at 2:04). Use these only to ground \
the "chapters" timestamps below — never let them leak into executiveSummary or keyPoints.

Ignore low-value filler entirely when writing the summary and key points: greetings, hooks ("estás en el \
lugar adecuado"), sponsor reads, calls to like/subscribe/comment, "in this video I'll show you" framing, \
recaps of a previous video, and outro remarks. None of that belongs in the output even if it takes up a \
large share of the transcript. Extract the actual substance — claims, facts, names, numbers, causes, \
turning points, arguments, conclusions — and write about that.

Produce:
- "executiveSummary": 2-4 dense sentences stating the actual content — the specific claims, facts, events, \
or conclusions conveyed — not a description of the video as an object. Never write a sentence whose subject \
is "the video"/"el video" paired with a meta-verb like "explora", "presenta", "ofrece", "habla de", "cubre", \
"analiza" — that describes the packaging, not the substance, and is useless to someone who needs to know \
what's actually true or what actually happened. State it directly instead, the way you'd state it if it \
were general knowledge. Bad: "El video explora los orígenes de la guerra de Troya y sus personajes \
principales." Good: "La guerra de Troya comenzó por el juicio de Paris, quien eligió a Afrodita sobre Hera y \
Atenea a cambio del amor de Helena, esposa de Menelao de Esparta — ese rapto desencadenó la guerra." If you \
catch yourself writing "the video/content [verb]s...", stop and rewrite it as the underlying claim itself.
- "keyPoints": ordered from most to least important, each one a specific, concrete, self-contained fact or \
claim from the content (not a vague topic label like "habla sobre la guerra de Troya" — say what it actually \
claims about it). Each bullet should be something worth remembering, phrased so it reads like a flashcard or \
exam-cram note, not a table of contents. Skip anything a viewer could safely not know. Use as many or as few \
bullets as the content actually supports — a short, focused video might only earn 3, a dense or sprawling \
one might earn 20+. Never pad the list to hit a round number, and never cut real substance to keep it short.
- "keywords": relevant terms, names, and concepts someone could use to search for or categorize this content.
- "chapters": the video split into topical sections someone could jump between, covering start to finish with \
no gaps. The first chapter's "startSeconds" must be 0. Each "startSeconds" must be one of the exact second \
values given in the "[Ns]" tags — pick the tag where that topic actually begins, don't invent or interpolate \
a number. Each "title" is short (3-8 words) and names what that section actually covers (not "Introducción" / \
"Desarrollo" / "Conclusión" unless that's genuinely and specifically what happens there). Split on real topic \
shifts, not on a fixed time interval — a short video might only need 2-3 chapters, a long or sprawling one \
might need 10+; never force an even spacing.

Write executiveSummary, keyPoints, and chapter titles entirely in ${languageName}, regardless of the language \
the transcript itself is in. Keywords may stay in their original language if translating them would lose \
meaning (e.g. proper nouns, technical terms). Respond ONLY with JSON matching this shape: \
{ "executiveSummary": string, "keyPoints": string[], "keywords": string[], \
"chapters": { "title": string, "startSeconds": number }[] }.`;
}

export class Gpt4oSummaryAdapter implements SummaryProviderPort {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async summarize(segments: TranscriptSegment[], language: SummaryLanguage): Promise<Summary> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(language) },
        { role: "user", content: buildTimestampedTranscript(segments) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("GPT-4o returned an empty response");
    }

    return summaryAnalysisSchema.parse(JSON.parse(content));
  }
}
