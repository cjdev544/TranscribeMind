import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFreeUpVideoSpace } from "./use-free-up-video-space.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createQueryClient, createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

describe("useFreeUpVideoSpace", () => {
  it("posts to free-space and invalidates the video and list caches", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined });
    const queryClient = createQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useFreeUpVideoSpace("v1"), { wrapper: createWrapper(queryClient) });

    result.current.mutate();

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["video", "v1"] }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["videos"] });
    expect(apiClient.post).toHaveBeenCalledWith("/api/videos/v1/free-space");
  });
});
