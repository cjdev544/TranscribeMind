import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useRetryVideo } from "./use-retry-video.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createQueryClient, createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

describe("useRetryVideo", () => {
  it("posts to retry and invalidates the video and list caches", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined });
    const queryClient = createQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useRetryVideo("v1"), { wrapper: createWrapper(queryClient) });

    result.current.mutate();

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["video", "v1"] }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["videos"] });
    expect(apiClient.post).toHaveBeenCalledWith("/api/videos/v1/retry");
  });
});
