import OpenAI from "openai";
import pLimit from "p-limit";
import { SummaryLanguage, type TranscriptSegment } from "@transcribemind/contracts";
import type { TranscriptTranslatorPort } from "../../domain/ports/transcript-translator.port.js";

/** Keeps each translation request well within context limits regardless of transcript length. */
const SEGMENTS_PER_BATCH = 80;
const MAX_CONCURRENT_BATCHES = 3;

const LANGUAGE_NAMES: Record<SummaryLanguage, string> = {
  [SummaryLanguage.ES]: "Spanish (español)",
  [SummaryLanguage.EN]: "English",
  [SummaryLanguage.DE]: "German (Deutsch)",
};

function buildSystemPrompt(languageName: string): string {
  return `You translate video transcript fragments into ${languageName}. You will receive a JSON array of \
strings, each one a fragment of the same transcript in its original spoken language. Translate every fragment \
into ${languageName}, preserving the original meaning, tone, and order. Respond ONLY with a JSON object of the \
shape { "translations": string[] }, with exactly as many entries as the input array, in the same order.`;
}

export class Gpt4oTranscriptTranslatorAdapter implements TranscriptTranslatorPort {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async translateSegments(
    segments: TranscriptSegment[],
    targetLanguage: SummaryLanguage,
  ): Promise<TranscriptSegment[]> {
    if (segments.length === 0) return segments;

    const batches: TranscriptSegment[][] = [];
    for (let i = 0; i < segments.length; i += SEGMENTS_PER_BATCH) {
      batches.push(segments.slice(i, i + SEGMENTS_PER_BATCH));
    }

    const limit = pLimit(MAX_CONCURRENT_BATCHES);
    const translatedBatches = await Promise.all(
      batches.map((batch) => limit(() => this.translateBatch(batch, targetLanguage))),
    );

    return translatedBatches.flat();
  }

  private async translateBatch(
    batch: TranscriptSegment[],
    targetLanguage: SummaryLanguage,
  ): Promise<TranscriptSegment[]> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(LANGUAGE_NAMES[targetLanguage]) },
        { role: "user", content: JSON.stringify(batch.map((segment) => segment.text)) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("GPT-4o returned an empty response while translating the transcript");
    }

    const parsed = JSON.parse(content) as { translations?: unknown };
    const translations = parsed.translations;
    if (!Array.isArray(translations) || translations.length !== batch.length) {
      throw new Error("GPT-4o returned a mismatched number of translated transcript fragments");
    }

    return batch.map((segment, index) => ({ ...segment, text: String(translations[index]) }));
  }
}
