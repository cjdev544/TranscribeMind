import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAskVideo } from "./use-ask-video.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

describe("useAskVideo", () => {
  it("posts the question and history, returning the answer", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { answer: "It's about cats." } });
    const { result } = renderHook(() => useAskVideo("v1"), { wrapper: createWrapper() });
    const history = [{ role: "user" as const, content: "hi" }];

    result.current.mutate({ question: "What is this about?", history });

    await waitFor(() => expect(result.current.data).toBe("It's about cats."));
    expect(apiClient.post).toHaveBeenCalledWith("/api/videos/v1/ask", {
      question: "What is this about?",
      history,
    });
  });
});
