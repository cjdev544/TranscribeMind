import { describe, expect, it, vi } from "vitest";
import { GetVideoUseCase } from "./get-video.use-case.js";
import { mockVideoRepository, makeVideo } from "../../../test/mockVideoPorts.js";

describe("GetVideoUseCase", () => {
  it("returns the video when it belongs to the requester", async () => {
    const video = makeVideo({ id: "v1", userId: "u1" });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const useCase = new GetVideoUseCase(videoRepository);

    const result = await useCase.execute({ videoId: "v1", requesterId: "u1" });

    expect(result).toBe(video);
  });

  it("throws NotFoundError when the video does not exist", async () => {
    const useCase = new GetVideoUseCase(mockVideoRepository());

    await expect(useCase.execute({ videoId: "missing", requesterId: "u1" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws UnauthorizedError when the video belongs to another user", async () => {
    const video = makeVideo({ id: "v1", userId: "owner" });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const useCase = new GetVideoUseCase(videoRepository);

    await expect(useCase.execute({ videoId: "v1", requesterId: "stranger" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
