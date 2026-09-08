import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLogin } from "./use-login.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createQueryClient, createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

const user = { id: "u1", email: "a@b.com", username: "auser", avatarUrl: null };

describe("useLogin", () => {
  it("posts the credentials and caches the returned user under ['auth','me']", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: user });
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper(queryClient) });

    result.current.mutate({ email: "a@b.com", password: "password1" });

    await waitFor(() => expect(queryClient.getQueryData(["auth", "me"])).toEqual(user));
    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/login", { email: "a@b.com", password: "password1" });
  });
});
