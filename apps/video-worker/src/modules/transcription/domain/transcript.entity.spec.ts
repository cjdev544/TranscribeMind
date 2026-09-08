import { describe, expect, it } from "vitest";
import { mergeTranscribedChunks, type TranscribedChunk } from "./transcript.entity.js";

function chunk(overrides: Partial<TranscribedChunk> = {}): TranscribedChunk {
  return {
    offsetSeconds: 0,
    text: "hola",
    segments: [{ start: 0, end: 1, text: "hola" }],
    language: "spanish",
    ...overrides,
  };
}

describe("mergeTranscribedChunks", () => {
  it("concatenates the text of a single chunk", () => {
    const result = mergeTranscribedChunks([chunk({ text: "hola mundo" })]);

    expect(result.fullText).toBe("hola mundo");
  });

  it("joins multiple chunks' text with a space", () => {
    const result = mergeTranscribedChunks([
      chunk({ offsetSeconds: 0, text: "primera parte" }),
      chunk({ offsetSeconds: 30, text: "segunda parte" }),
    ]);

    expect(result.fullText).toBe("primera parte segunda parte");
  });

  it("shifts each chunk's segment timestamps by its offset", () => {
    const result = mergeTranscribedChunks([
      chunk({ offsetSeconds: 0, segments: [{ start: 0, end: 2, text: "a" }] }),
      chunk({ offsetSeconds: 30, segments: [{ start: 0, end: 3, text: "b" }] }),
    ]);

    expect(result.segments).toEqual([
      { start: 0, end: 2, text: "a" },
      { start: 30, end: 33, text: "b" },
    ]);
  });

  it("orders chunks by offset regardless of input order", () => {
    const result = mergeTranscribedChunks([
      chunk({ offsetSeconds: 30, text: "segunda" }),
      chunk({ offsetSeconds: 0, text: "primera" }),
    ]);

    expect(result.fullText).toBe("primera segunda");
  });

  it("trims each chunk's text before joining", () => {
    const result = mergeTranscribedChunks([chunk({ text: "  con espacios  " })]);

    expect(result.fullText).toBe("con espacios");
  });

  it("returns empty results for an empty chunk list", () => {
    const result = mergeTranscribedChunks([]);

    expect(result).toEqual({ fullText: "", segments: [] });
  });
});
