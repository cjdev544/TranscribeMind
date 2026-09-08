import { describe, expect, it, vi } from "vitest";

const { commandMock } = vi.hoisted(() => {
  const command = {
    setStartTime: vi.fn().mockReturnThis(),
    setDuration: vi.fn().mockReturnThis(),
    audioCodec: vi.fn().mockReturnThis(),
    on: vi.fn(function (this: typeof command, event: string, handler: () => void) {
      if (event === "end") setImmediate(handler);
      return this;
    }),
    save: vi.fn().mockReturnThis(),
  };
  return { commandMock: command };
});

vi.mock("fluent-ffmpeg", () => ({ default: vi.fn(() => commandMock) }));

const { FluentFfmpegAudioSplitter } = await import("./fluent-ffmpeg-audio-splitter.adapter.js");

describe("FluentFfmpegAudioSplitter", () => {
  it("splits into as many chunks as needed to stay under the byte budget", async () => {
    const splitter = new FluentFfmpegAudioSplitter();

    // 100 seconds at 1MB/s = 100MB total; a 20MB budget means 20s chunks, 5 chunks.
    const chunks = await splitter.split({
      audioFilePath: "/tmp/audio.mp3",
      durationSeconds: 100,
      sizeBytes: 100 * 1024 * 1024,
      maxBytesPerChunk: 20 * 1024 * 1024,
    });

    expect(chunks).toHaveLength(5);
    expect(chunks[0]).toEqual({ filePath: "/tmp/audio.mp3.part0.mp3", offsetSeconds: 0 });
    expect(chunks[1]!.offsetSeconds).toBe(20);
  });

  it("produces a single chunk when the whole file already fits the budget", async () => {
    const splitter = new FluentFfmpegAudioSplitter();

    const chunks = await splitter.split({
      audioFilePath: "/tmp/audio.mp3",
      durationSeconds: 60,
      sizeBytes: 5 * 1024 * 1024,
      maxBytesPerChunk: 20 * 1024 * 1024,
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.offsetSeconds).toBe(0);
  });

  it("never produces a zero-second chunk duration even for a very high bitrate", async () => {
    const splitter = new FluentFfmpegAudioSplitter();

    const chunks = await splitter.split({
      audioFilePath: "/tmp/audio.mp3",
      durationSeconds: 10,
      sizeBytes: 1000 * 1024 * 1024,
      maxBytesPerChunk: 1024,
    });

    // Falls back to a minimum 1-second chunk duration, so still 10 chunks over 10s.
    expect(chunks).toHaveLength(10);
  });
});
