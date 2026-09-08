import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SUMMARY_LANGUAGE_LABELS, SummaryLanguage } from "@transcribemind/contracts";
import { LanguageSelect } from "./LanguageSelect.js";

describe("LanguageSelect", () => {
  it("lists every supported summary language", () => {
    render(<LanguageSelect value={SummaryLanguage.ES} onChange={vi.fn()} />);

    for (const language of Object.values(SummaryLanguage)) {
      expect(screen.getByRole("option", { name: SUMMARY_LANGUAGE_LABELS[language] })).toBeInTheDocument();
    }
  });

  it("shows the current value as selected", () => {
    render(<LanguageSelect value={SummaryLanguage.EN} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveValue(SummaryLanguage.EN);
  });

  it("calls onChange with the newly selected language", async () => {
    const onChange = vi.fn();
    render(<LanguageSelect value={SummaryLanguage.ES} onChange={onChange} />);
    const actor = userEvent.setup();

    await actor.selectOptions(screen.getByRole("combobox"), SUMMARY_LANGUAGE_LABELS[SummaryLanguage.EN]);

    expect(onChange).toHaveBeenCalledWith(SummaryLanguage.EN);
  });
});
