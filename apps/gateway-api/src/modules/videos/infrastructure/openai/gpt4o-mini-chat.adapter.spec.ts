import { beforeEach, describe, expect, it, vi } from "vitest";
import { SummaryLanguage } from "@transcribemind/contracts";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: createMock } };
  },
}));

const { Gpt4oMiniChatAdapter } = await import("./gpt4o-mini-chat.adapter.js");

const segments = [{ start: 0, end: 5, text: "hola mundo" }];

describe("Gpt4oMiniChatAdapter", () => {
  beforeEach(() => {
    createMock.mockClear();
  });

  it("returns the model's reply content", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: "respuesta" } }] });
    const adapter = new Gpt4oMiniChatAdapter("test-key");

    const result = await adapter.ask({ segments, language: SummaryLanguage.ES, question: "de que trata?", history: [] });

    expect(result).toBe("respuesta");
  });

  it("sends the transcript-grounded system prompt, history, and question as chat messages", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: "ok" } }] });
    const adapter = new Gpt4oMiniChatAdapter("test-key");

    await adapter.ask({
      segments,
      language: SummaryLanguage.EN,
      question: "what is this about?",
      history: [{ role: "user", content: "previous question" }],
    });

    const call = createMock.mock.calls[0]![0];
    expect(call.model).toBe("gpt-4o-mini");
    expect(call.messages[0].role).toBe("system");
    expect(call.messages[0].content).toContain("hola mundo");
    expect(call.messages[0].content).toContain("English");
    expect(call.messages[1]).toEqual({ role: "user", content: "previous question" });
    expect(call.messages.at(-1)).toEqual({ role: "user", content: "what is this about?" });
  });

  it("throws when the model returns no content", async () => {
    createMock.mockResolvedValue({ choices: [{ message: {} }] });
    const adapter = new Gpt4oMiniChatAdapter("test-key");

    await expect(adapter.ask({ segments, language: SummaryLanguage.ES, question: "hola", history: [] })).rejects.toThrow(
      "GPT-4o-mini returned an empty response"
    );
  });
});
