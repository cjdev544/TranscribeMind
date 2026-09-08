import { describe, expect, it, vi } from "vitest";
import { VideoStatus } from "@transcribemind/contracts";
import { RetryVideoUseCase } from "./retry-video.use-case.js";
import { mockVideoRepository, mockJobQueue, makeVideo } from "../../../test/mockVideoPorts.js";

describe("RetryVideoUseCase", () => {
  it("resets and re-enqueues a failed video", async () => {
    const video = makeVideo({ id: "v1", userId: "u1", status: VideoStatus.FAILED });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const jobQueue = mockJobQueue();
    const useCase = new RetryVideoUseCase(videoRepository, jobQueue);

    await useCase.execute({ videoId: "v1", requesterId: "u1" });

    expect(videoRepository.resetForRetry).toHaveBeenCalledWith("v1");
    expect(jobQueue.enqueueVideoProcessing).toHaveBeenCalledWith(
      expect.objectContaining({ videoId: "v1", userId: "u1" })
    );
  });

  it("throws NotFoundError when the video does not exist", async () => {
    const useCase = new RetryVideoUseCase(mockVideoRepository(), mockJobQueue());

    await expect(useCase.execute({ videoId: "missing", requesterId: "u1" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws UnauthorizedError for another user's video", async () => {
    const video = makeVideo({ id: "v1", userId: "owner", status: VideoStatus.FAILED });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const useCase = new RetryVideoUseCase(videoRepository, mockJobQueue());

    await expect(useCase.execute({ videoId: "v1", requesterId: "stranger" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws ConflictError when the video is not in FAILED status", async () => {
    const video = makeVideo({ id: "v1", userId: "u1", status: VideoStatus.COMPLETED });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const useCase = new RetryVideoUseCase(videoRepository, mockJobQueue());

    await expect(useCase.execute({ videoId: "v1", requesterId: "u1" })).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
