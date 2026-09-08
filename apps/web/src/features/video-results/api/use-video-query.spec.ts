import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { VideoStatusValues } from "../../../shared/types/video.js";
import type { Video } from "../../../shared/types/video.js";
import { useVideoQuery } from "./use-video-query.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { get: vi.fn() } }));

function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    id: "v1",
    userId: "u1",
    title: "My video",
    originalFilename: "clip.mp4",
    s3Key: "s3/clip.mp4",
    status: VideoStatusValues.TRANSCRIBING,
    progress: 50,
    durationSeconds: null,
    transcript: null,
    transcriptSegments: null,
    analysis: null,
    error: null,
    completedAt: null,
    fileDeletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("useVideoQuery", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches a video by id", async () => {
    const video = makeVideo();
    vi.mocked(apiClient.get).mockResolvedValue({ data: video });

    const { result } = renderHook(() => useVideoQuery("v1"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toEqual(video));
    expect(apiClient.get).toHaveBeenCalledWith("/api/videos/v1");
  });

  it("keeps polling every 5s while the video is still processing", async () => {
    vi.useFakeTimers();
    const video = makeVideo({ status: VideoStatusValues.TRANSCRIBING });
    vi.mocked(apiClient.get).mockResolvedValue({ data: video });
    const { result } = renderHook(() => useVideoQuery("v1"), { wrapper: createWrapper() });
    await vi.waitFor(() => expect(result.current.data).toEqual(video));
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(5_000);

    await vi.waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
  });

  it("stops polling once the video reaches a terminal status", async () => {
    const video = makeVideo({ status: VideoStatusValues.COMPLETED });
    vi.mocked(apiClient.get).mockResolvedValue({ data: video });
    const { result } = renderHook(() => useVideoQuery("v1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toEqual(video));
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(10_000);
    vi.useRealTimers();

    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});
