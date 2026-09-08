import { describe, expect, it, vi } from "vitest";

const { setFfmpegPathMock, setFfprobePathMock } = vi.hoisted(() => ({
  setFfmpegPathMock: vi.fn(),
  setFfprobePathMock: vi.fn(),
}));

vi.mock("fluent-ffmpeg", () => ({
  default: { setFfmpegPath: setFfmpegPathMock, setFfprobePath: setFfprobePathMock },
}));
vi.mock("@ffmpeg-installer/ffmpeg", () => ({ default: { path: "/bin/ffmpeg" } }));
vi.mock("@ffprobe-installer/ffprobe", () => ({ default: { path: "/bin/ffprobe" } }));

describe("ffmpeg-runtime", () => {
  it("points fluent-ffmpeg at the bundled ffmpeg and ffprobe binaries on import", async () => {
    await import("./ffmpeg-runtime.js");

    expect(setFfmpegPathMock).toHaveBeenCalledWith("/bin/ffmpeg");
    expect(setFfprobePathMock).toHaveBeenCalledWith("/bin/ffprobe");
  });
});
