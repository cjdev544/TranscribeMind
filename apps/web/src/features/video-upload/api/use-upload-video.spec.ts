import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { SummaryLanguage } from "@transcribemind/contracts";
import { useUploadVideo } from "./use-upload-video.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createQueryClient, createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

describe("useUploadVideo", () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockClear();
  });


  it("posts the file, title, and language as multipart form data", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "v1", status: "QUEUED" } });
    const { result } = renderHook(() => useUploadVideo(vi.fn()), { wrapper: createWrapper() });
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });

    result.current.mutate({ file, title: "  Mi video  ", summaryLanguage: SummaryLanguage.ES });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [url, body, config] = vi.mocked(apiClient.post).mock.calls[0]!;
    expect(url).toBe("/api/videos/upload");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("title")).toBe("Mi video");
    expect((body as FormData).get("summaryLanguage")).toBe(SummaryLanguage.ES);
    expect(config).toMatchObject({ headers: { "Content-Type": "multipart/form-data" } });
  });

  it("omits the title field when it is blank", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "v1", status: "QUEUED" } });
    const { result } = renderHook(() => useUploadVideo(vi.fn()), { wrapper: createWrapper() });
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });

    result.current.mutate({ file, title: "   ", summaryLanguage: SummaryLanguage.ES });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [, body] = vi.mocked(apiClient.post).mock.calls[0]!;
    expect((body as FormData).has("title")).toBe(false);
  });

  it("reports upload progress as a rounded percentage", async () => {
    vi.mocked(apiClient.post).mockImplementation(async (_url, _body, config) => {
      config?.onUploadProgress?.({ loaded: 33, total: 100 } as never);
      return { data: { id: "v1", status: "QUEUED" } };
    });
    const onProgress = vi.fn();
    const { result } = renderHook(() => useUploadVideo(onProgress), { wrapper: createWrapper() });
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });

    result.current.mutate({ file, summaryLanguage: SummaryLanguage.ES });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onProgress).toHaveBeenCalledWith(33);
  });

  it("invalidates the videos list on success", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "v1", status: "QUEUED" } });
    const queryClient = createQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUploadVideo(vi.fn()), { wrapper: createWrapper(queryClient) });
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });

    result.current.mutate({ file, summaryLanguage: SummaryLanguage.ES });

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["videos"] }));
  });
});
