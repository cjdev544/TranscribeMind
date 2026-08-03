import { createReadStream } from "node:fs";
import OpenAI from "openai";
import type { TranscriptSegment } from "@transcribemind/contracts";
import type { TranscriptionProviderPort } from "../../domain/ports/transcription-provider.port.js";

export class WhisperTranscriptionAdapter implements TranscriptionProviderPort {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async transcribe(
    audioFilePath: string,
  ): Promise<{ text: string; segments: TranscriptSegment[]; language: string }> {
    const response = await this.client.audio.transcriptions.create({
      file: createReadStream(audioFilePath),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    const segments: TranscriptSegment[] = (response.segments ?? []).map((segment) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text,
    }));

    // verbose_json reports the spoken language Whisper detected (e.g. "english"),
    // used upstream to decide whether the transcript needs translating into
    // the user's requested summary language.
    return { text: response.text, segments, language: response.language };
  }
}
