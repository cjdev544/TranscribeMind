export const SummaryLanguage = {
  ES: "es",
  EN: "en",
  DE: "de",
} as const;

export type SummaryLanguage = (typeof SummaryLanguage)[keyof typeof SummaryLanguage];

export const DEFAULT_SUMMARY_LANGUAGE: SummaryLanguage = SummaryLanguage.ES;

export const SUMMARY_LANGUAGE_LABELS: Record<SummaryLanguage, string> = {
  [SummaryLanguage.ES]: "Español",
  [SummaryLanguage.EN]: "English",
  [SummaryLanguage.DE]: "Deutsch",
};
