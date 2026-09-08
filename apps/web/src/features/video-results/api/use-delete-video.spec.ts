import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDeleteVideo } from "./use-delete-video.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createQueryClient, createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { delete: vi.fn() } }));

describe("useDeleteVideo", () => {
  it("deletes the video, removes its cache entry, and invalidates the list", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });
    const queryClient = createQueryClient();
    queryClient.setQueryData(["video", "v1"], { id: "v1" });
    const removeSpy = vi.spyOn(queryClient, "removeQueries");
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteVideo(), { wrapper: createWrapper(queryClient) });

    result.current.mutate("v1");

    await waitFor(() => expect(removeSpy).toHaveBeenCalledWith({ queryKey: ["video", "v1"] }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["videos"] });
    expect(apiClient.delete).toHaveBeenCalledWith("/api/videos/v1");
  });
});
