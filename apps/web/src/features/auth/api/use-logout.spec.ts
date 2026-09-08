import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLogout } from "./use-logout.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createQueryClient, createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

describe("useLogout", () => {
  it("posts to the logout endpoint and clears the entire query cache", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined });
    const queryClient = createQueryClient();
    queryClient.setQueryData(["auth", "me"], { id: "u1" });
    queryClient.setQueryData(["videos"], [{ id: "v1" }]);
    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper(queryClient) });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/logout");
    // queryClient.clear() wipes everything, including the ["auth","me"] entry
    // the onSuccess handler had just set to null — so it's undefined, not null.
    expect(queryClient.getQueryData(["auth", "me"])).toBeUndefined();
    expect(queryClient.getQueryData(["videos"])).toBeUndefined();
  });
});
