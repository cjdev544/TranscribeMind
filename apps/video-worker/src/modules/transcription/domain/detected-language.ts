import { SummaryLanguage } from "@transcribemind/contracts";

/** Whisper's verbose_json reports the detected language as a full English name (e.g. "english"). */
const WHISPER_LANGUAGE_NAME_TO_CODE: Record<string, SummaryLanguage> = {
  english: SummaryLanguage.EN,
  spanish: SummaryLanguage.ES,
  german: SummaryLanguage.DE,
};

/**
 * Whether the transcript Whisper produced needs translating to match the
 * user's requested summary language. Any language we don't explicitly
 * recognize is treated as needing translation too, since we can't otherwise
 * confirm it already matches the target.
 */
export function needsTranslation(detectedLanguage: string, targetLanguage: SummaryLanguage): boolean {
  const detectedCode = WHISPER_LANGUAGE_NAME_TO_CODE[detectedLanguage.toLowerCase().trim()];
  return detectedCode !== targetLanguage;
}
