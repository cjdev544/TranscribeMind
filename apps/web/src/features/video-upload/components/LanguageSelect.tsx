import { SUMMARY_LANGUAGE_LABELS, SummaryLanguage } from "@transcribemind/contracts";
import { Select } from "../../../shared/ui/select.js";

export function LanguageSelect({
  value,
  onChange,
}: {
  value: SummaryLanguage;
  onChange: (language: SummaryLanguage) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      Idioma del resumen
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value as SummaryLanguage)}
        className="w-auto"
      >
        {Object.values(SummaryLanguage).map((language) => (
          <option key={language} value={language}>
            {SUMMARY_LANGUAGE_LABELS[language]}
          </option>
        ))}
      </Select>
    </label>
  );
}
