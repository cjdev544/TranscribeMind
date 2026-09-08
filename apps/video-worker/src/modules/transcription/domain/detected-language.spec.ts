import { describe, expect, it } from "vitest";
import { SummaryLanguage } from "@transcribemind/contracts";
import { needsTranslation } from "./detected-language.js";

describe("needsTranslation", () => {
  it("returns false when the detected language already matches the target", () => {
    expect(needsTranslation("spanish", SummaryLanguage.ES)).toBe(false);
  });

  it("returns true when the detected language differs from the target", () => {
    expect(needsTranslation("english", SummaryLanguage.ES)).toBe(true);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(needsTranslation("  Spanish  ", SummaryLanguage.ES)).toBe(false);
    expect(needsTranslation("ENGLISH", SummaryLanguage.EN)).toBe(false);
  });

  it("treats an unrecognized language as needing translation", () => {
    expect(needsTranslation("klingon", SummaryLanguage.ES)).toBe(true);
  });

  it("recognizes German", () => {
    expect(needsTranslation("german", SummaryLanguage.DE)).toBe(false);
    expect(needsTranslation("german", SummaryLanguage.ES)).toBe(true);
  });
});
