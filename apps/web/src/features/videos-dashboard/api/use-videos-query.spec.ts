import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useVideosQuery } from "./use-videos-query.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { get: vi.fn() } }));

describe("useVideosQuery", () => {
  it("fetches videos with the given filter as query params", async () => {
    const videos = [{ id: "v1" }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: videos });

    const { result } = renderHook(() => useVideosQuery({ status: "COMPLETED" as never, search: "cats" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(videos));
    expect(apiClient.get).toHaveBeenCalledWith("/api/videos", {
      params: { status: "COMPLETED", search: "cats" },
    });
  });

  it("keys the query by filter so different filters cache separately", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    const { result: allResult } = renderHook(() => useVideosQuery({}), { wrapper: createWrapper() });
    await waitFor(() => expect(allResult.current.isSuccess).toBe(true));

    vi.mocked(apiClient.get).mockClear();
    const { result: filteredResult } = renderHook(() => useVideosQuery({ search: "dogs" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(filteredResult.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith("/api/videos", { params: { search: "dogs" } });
  });
});
