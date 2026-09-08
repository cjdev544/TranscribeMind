import { describe, expect, it, vi } from "vitest";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("openai", () => ({
  default: class {
    audio = { transcriptions: { create: createMock } };
  },
}));
vi.mock("node:fs", () => ({ createReadStream: vi.fn().mockReturnValue("fake-stream") }));

const { WhisperTranscriptionAdapter } = await import("./whisper-transcription.adapter.js");

describe("WhisperTranscriptionAdapter", () => {
  it("maps the verbose_json response to text, segments, and detected language", async () => {
    createMock.mockResolvedValue({
      text: "hola mundo",
      language: "spanish",
      segments: [{ start: 0, end: 1, text: "hola", extra: "ignored" }],
    });
    const adapter = new WhisperTranscriptionAdapter("test-key");

    const result = await adapter.transcribe("/tmp/audio.mp3");

    expect(result).toEqual({
      text: "hola mundo",
      language: "spanish",
      segments: [{ start: 0, end: 1, text: "hola" }],
    });
  });

  it("defaults to an empty segments array when the response has none", async () => {
    createMock.mockResolvedValue({ text: "hola", language: "spanish" });
    const adapter = new WhisperTranscriptionAdapter("test-key");

    const result = await adapter.transcribe("/tmp/audio.mp3");

    expect(result.segments).toEqual([]);
  });

  it("requests the verbose_json format with segment timestamp granularity", async () => {
    createMock.mockResolvedValue({ text: "x", language: "es" });
    const adapter = new WhisperTranscriptionAdapter("test-key");

    await adapter.transcribe("/tmp/audio.mp3");

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "whisper-1", response_format: "verbose_json", timestamp_granularities: ["segment"] })
    );
  });
});
