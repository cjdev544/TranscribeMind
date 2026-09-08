import { describe, expect, it, vi } from "vitest";

const { ffmpegMock, ffprobeMock, commandMock, statMock } = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const command = {
    noVideo: vi.fn().mockReturnThis(),
    audioCodec: vi.fn().mockReturnThis(),
    audioChannels: vi.fn().mockReturnThis(),
    audioBitrate: vi.fn().mockReturnThis(),
    on: vi.fn(function (this: typeof command, event: string, handler: (...args: unknown[]) => void) {
      handlers.set(event, handler);
      return this;
    }),
    save: vi.fn(() => {
      setImmediate(() => handlers.get("end")?.());
    }),
    handlers,
  };
  const ffprobeMock = vi.fn();
  const ffmpegMock = Object.assign(
    vi.fn(() => command),
    { ffprobe: ffprobeMock }
  );
  return { ffmpegMock, ffprobeMock, commandMock: command, statMock: vi.fn() };
});

vi.mock("fluent-ffmpeg", () => ({ default: ffmpegMock }));
vi.mock("node:fs/promises", () => ({ stat: statMock }));

const { FluentFfmpegAudioExtractor } = await import("./fluent-ffmpeg-audio-extractor.adapter.js");

describe("FluentFfmpegAudioExtractor", () => {
  it("extracts audio and reports the resulting file's path, size, and duration", async () => {
    ffprobeMock.mockImplementation((_path: string, cb: (err: null, data: { format: { duration: number } }) => void) => {
      cb(null, { format: { duration: 45 } });
    });
    statMock.mockResolvedValue({ size: 12345 });
    const extractor = new FluentFfmpegAudioExtractor();

    const result = await extractor.extract("/tmp/video.mp4");

    expect(result).toEqual({ audioFilePath: "/tmp/video.mp4.mp3", sizeBytes: 12345, durationSeconds: 45 });
  });

  it("reports progress as a percentage of the source duration, capped at 99", async () => {
    let probeCall = 0;
    ffprobeMock.mockImplementation((_path: string, cb: (err: null, data: { format: { duration: number } }) => void) => {
      probeCall += 1;
      // First probe: source video duration (100s). Second probe: output audio duration.
      cb(null, { format: { duration: probeCall === 1 ? 100 : 45 } });
    });
    statMock.mockResolvedValue({ size: 1000 });
    const extractor = new FluentFfmpegAudioExtractor();
    const onProgress = vi.fn();

    const promise = extractor.extract("/tmp/video.mp4", onProgress);
    await new Promise((resolve) => setImmediate(resolve));
    commandMock.handlers.get("progress")?.({ timemark: "00:00:50.00" });
    await promise;

    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it("configures a mono, 64k mp3 audio-only encode", async () => {
    ffprobeMock.mockImplementation((_path: string, cb: (err: null, data: { format: { duration: number } }) => void) => {
      cb(null, { format: { duration: 10 } });
    });
    statMock.mockResolvedValue({ size: 500 });
    const extractor = new FluentFfmpegAudioExtractor();

    await extractor.extract("/tmp/video.mp4");

    expect(commandMock.noVideo).toHaveBeenCalled();
    expect(commandMock.audioCodec).toHaveBeenCalledWith("libmp3lame");
    expect(commandMock.audioChannels).toHaveBeenCalledWith(1);
    expect(commandMock.audioBitrate).toHaveBeenCalledWith("64k");
  });
});
