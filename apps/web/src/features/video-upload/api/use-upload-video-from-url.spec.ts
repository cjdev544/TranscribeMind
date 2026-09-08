import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { SummaryLanguage } from "@transcribemind/contracts";
import { useUploadVideoFromUrl } from "./use-upload-video-from-url.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createQueryClient, createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

describe("useUploadVideoFromUrl", () => {
  it("posts the url, language, and trimmed title", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "v1", status: "QUEUED" } });
    const { result } = renderHook(() => useUploadVideoFromUrl(), { wrapper: createWrapper() });

    result.current.mutate({ url: "https://youtube.com/watch?v=x", title: "  Mi video  ", summaryLanguage: SummaryLanguage.EN });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith("/api/videos/upload-url", {
      url: "https://youtube.com/watch?v=x",
      summaryLanguage: SummaryLanguage.EN,
      title: "Mi video",
    });
  });

  it("sends undefined title when blank", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "v1", status: "QUEUED" } });
    const { result } = renderHook(() => useUploadVideoFromUrl(), { wrapper: createWrapper() });

    result.current.mutate({ url: "https://example.com/v.mp4", title: "   ", summaryLanguage: SummaryLanguage.ES });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/videos/upload-url",
      expect.objectContaining({ title: undefined })
    );
  });

  it("invalidates the videos list on success", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "v1", status: "QUEUED" } });
    const queryClient = createQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUploadVideoFromUrl(), { wrapper: createWrapper(queryClient) });

    result.current.mutate({ url: "https://example.com/v.mp4", summaryLanguage: SummaryLanguage.ES });

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["videos"] }));
  });
});
