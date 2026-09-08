import { afterEach, describe, expect, it, vi } from "vitest";
import type { FetchedRemoteVideo } from "../../domain/ports/remote-video-fetcher.port.js";

const { ytDlpFetchMock, directFetchMock } = vi.hoisted(() => ({
  ytDlpFetchMock: vi.fn(),
  directFetchMock: vi.fn(),
}));

vi.mock("./ytdlp-remote-video-fetcher.adapter.js", () => ({
  isYoutubeUrl: (url: string) => url.includes("youtube.com") || url.includes("youtu.be"),
  YtDlpRemoteVideoFetcherAdapter: class {
    fetch = ytDlpFetchMock;
  },
}));

vi.mock("./fetch-remote-video.adapter.js", () => ({
  FetchRemoteVideoAdapter: class {
    fetch = directFetchMock;
  },
}));

const { CompositeRemoteVideoFetcherAdapter } = await import("./composite-remote-video-fetcher.adapter.js");

const result: FetchedRemoteVideo = { filename: "x.mp4", contentType: "video/mp4", buffer: Buffer.from("x") };

describe("CompositeRemoteVideoFetcherAdapter", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("delegates a YouTube URL to the yt-dlp fetcher", async () => {
    ytDlpFetchMock.mockResolvedValue(result);
    const adapter = new CompositeRemoteVideoFetcherAdapter({ error: vi.fn() } as never);

    await adapter.fetch("https://youtube.com/watch?v=abc");

    expect(ytDlpFetchMock).toHaveBeenCalled();
    expect(directFetchMock).not.toHaveBeenCalled();
  });

  it("delegates a non-YouTube URL to the direct fetcher", async () => {
    directFetchMock.mockResolvedValue(result);
    const adapter = new CompositeRemoteVideoFetcherAdapter({ error: vi.fn() } as never);

    await adapter.fetch("https://example.com/video.mp4");

    expect(directFetchMock).toHaveBeenCalled();
    expect(ytDlpFetchMock).not.toHaveBeenCalled();
  });
});
