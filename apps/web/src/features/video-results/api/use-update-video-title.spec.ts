import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useUpdateVideoTitle } from "./use-update-video-title.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createQueryClient, createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { patch: vi.fn() } }));

describe("useUpdateVideoTitle", () => {
  it("patches the title, caches the returned video, and invalidates the list", async () => {
    const video = { id: "v1", title: "New title" };
    vi.mocked(apiClient.patch).mockResolvedValue({ data: video });
    const queryClient = createQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateVideoTitle("v1"), { wrapper: createWrapper(queryClient) });

    result.current.mutate("New title");

    await waitFor(() => expect(queryClient.getQueryData(["video", "v1"])).toEqual(video));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["videos"] });
    expect(apiClient.patch).toHaveBeenCalledWith("/api/videos/v1/title", { title: "New title" });
  });
});
