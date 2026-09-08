import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLoginWithGoogle } from "./use-login-with-google.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createQueryClient, createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

const user = { id: "u1", email: "a@b.com", username: "auser", avatarUrl: null };

describe("useLoginWithGoogle", () => {
  it("posts the id token and caches the returned user", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: user });
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useLoginWithGoogle(), { wrapper: createWrapper(queryClient) });

    result.current.mutate("id-token-123");

    await waitFor(() => expect(queryClient.getQueryData(["auth", "me"])).toEqual(user));
    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/google", { idToken: "id-token-123" });
  });
});
