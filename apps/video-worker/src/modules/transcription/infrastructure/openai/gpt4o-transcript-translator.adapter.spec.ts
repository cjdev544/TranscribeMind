import { beforeEach, describe, expect, it, vi } from "vitest";
import { SummaryLanguage } from "@transcribemind/contracts";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: createMock } };
  },
}));

const { Gpt4oTranscriptTranslatorAdapter } = await import("./gpt4o-transcript-translator.adapter.js");

describe("Gpt4oTranscriptTranslatorAdapter", () => {
  beforeEach(() => {
    createMock.mockClear();
  });

  it("returns an empty array unchanged without calling the API", async () => {
    const adapter = new Gpt4oTranscriptTranslatorAdapter("test-key");

    const result = await adapter.translateSegments([], SummaryLanguage.EN);

    expect(result).toEqual([]);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("translates each segment's text, preserving timestamps", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ translations: ["hello"] }) } }] });
    const adapter = new Gpt4oTranscriptTranslatorAdapter("test-key");

    const result = await adapter.translateSegments([{ start: 0, end: 2, text: "hola" }], SummaryLanguage.EN);

    expect(result).toEqual([{ start: 0, end: 2, text: "hello" }]);
  });

  it("splits more than 80 segments into multiple batched requests", async () => {
    createMock.mockImplementation(async (params: { messages: { content: string }[] }) => {
      const input = JSON.parse(params.messages[1]!.content) as string[];
      return { choices: [{ message: { content: JSON.stringify({ translations: input.map((t) => `${t}-en`) }) } }] };
    });
    const adapter = new Gpt4oTranscriptTranslatorAdapter("test-key");
    const segments = Array.from({ length: 85 }, (_, i) => ({ start: i, end: i + 1, text: `seg${i}` }));

    const result = await adapter.translateSegments(segments, SummaryLanguage.EN);

    expect(createMock).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(85);
    expect(result[0]!.text).toBe("seg0-en");
    expect(result[84]!.text).toBe("seg84-en");
  });

  it("throws when the model returns no content", async () => {
    createMock.mockResolvedValue({ choices: [{ message: {} }] });
    const adapter = new Gpt4oTranscriptTranslatorAdapter("test-key");

    await expect(adapter.translateSegments([{ start: 0, end: 1, text: "x" }], SummaryLanguage.EN)).rejects.toThrow(
      "GPT-4o returned an empty response while translating the transcript"
    );
  });

  it("throws when the translated array length does not match the batch", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ translations: [] }) } }] });
    const adapter = new Gpt4oTranscriptTranslatorAdapter("test-key");

    await expect(adapter.translateSegments([{ start: 0, end: 1, text: "x" }], SummaryLanguage.EN)).rejects.toThrow(
      "GPT-4o returned a mismatched number of translated transcript fragments"
    );
  });
});
