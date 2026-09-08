import { beforeEach, describe, expect, it, vi } from "vitest";
import { SummaryLanguage } from "@transcribemind/contracts";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: createMock } };
  },
}));

const { Gpt4oSummaryAdapter } = await import("./gpt4o-summary.adapter.js");

const segments = [{ start: 0, end: 5, text: "hola mundo" }];

describe("Gpt4oSummaryAdapter", () => {
  beforeEach(() => {
    createMock.mockClear();
  });

  it("parses and validates the model's JSON response against the summary schema", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ executiveSummary: "resumen", keyPoints: ["a"], keywords: ["b"] }) } }],
    });
    const adapter = new Gpt4oSummaryAdapter("test-key");

    const result = await adapter.summarize(segments, SummaryLanguage.ES);

    expect(result).toEqual({ executiveSummary: "resumen", keyPoints: ["a"], keywords: ["b"] });
  });

  it("includes timestamp-tagged transcript lines and the target language in the prompt", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ executiveSummary: "x", keyPoints: [], keywords: [] }) } }],
    });
    const adapter = new Gpt4oSummaryAdapter("test-key");

    await adapter.summarize(segments, SummaryLanguage.EN);

    const call = createMock.mock.calls[0]![0];
    expect(call.messages[1].content).toBe("[0s] hola mundo");
    expect(call.messages[0].content).toContain("English");
  });

  it("throws when the model returns no content", async () => {
    createMock.mockResolvedValue({ choices: [{ message: {} }] });
    const adapter = new Gpt4oSummaryAdapter("test-key");

    await expect(adapter.summarize(segments, SummaryLanguage.ES)).rejects.toThrow("GPT-4o returned an empty response");
  });

  it("throws when the model's JSON does not match the expected schema", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ wrong: "shape" }) } }] });
    const adapter = new Gpt4oSummaryAdapter("test-key");

    await expect(adapter.summarize(segments, SummaryLanguage.ES)).rejects.toThrow();
  });

  it("accepts a response that includes optional chapters", async () => {
    createMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              executiveSummary: "x",
              keyPoints: [],
              keywords: [],
              chapters: [{ title: "Intro", startSeconds: 0 }],
            }),
          },
        },
      ],
    });
    const adapter = new Gpt4oSummaryAdapter("test-key");

    const result = await adapter.summarize(segments, SummaryLanguage.ES);

    expect(result.chapters).toEqual([{ title: "Intro", startSeconds: 0 }]);
  });
});
