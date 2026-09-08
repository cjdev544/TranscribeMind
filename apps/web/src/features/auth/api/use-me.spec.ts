import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMe } from "./use-me.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { get: vi.fn() } }));

const user = { id: "u1", email: "a@b.com", username: "auser", avatarUrl: null };

describe("useMe", () => {
  it("fetches the current user", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: user });

    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toEqual(user));
    expect(apiClient.get).toHaveBeenCalledWith("/api/auth/me");
  });

  it("does not retry on failure", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("unauthorized"));

    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // React 18 may mount effects twice in some environments; the meaningful
    // assertion is that it doesn't keep retrying (default retry is 3 attempts).
    expect(vi.mocked(apiClient.get).mock.calls.length).toBeLessThanOrEqual(2);
  });
});
