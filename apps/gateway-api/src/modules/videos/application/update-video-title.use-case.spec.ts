import { describe, expect, it, vi } from "vitest";
import { UpdateVideoTitleUseCase } from "./update-video-title.use-case.js";
import { mockVideoRepository, makeVideo } from "../../../test/mockVideoPorts.js";

describe("UpdateVideoTitleUseCase", () => {
  it("normalizes and persists the new title", async () => {
    const video = makeVideo({ id: "v1", userId: "u1" });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const useCase = new UpdateVideoTitleUseCase(videoRepository);

    const result = await useCase.execute({ videoId: "v1", requesterId: "u1", title: "  Nuevo título  " });

    expect(videoRepository.updateTitle).toHaveBeenCalledWith("v1", "Nuevo título");
    expect(result.title).toBe("Nuevo título");
  });

  it("throws NotFoundError when the video does not exist", async () => {
    const useCase = new UpdateVideoTitleUseCase(mockVideoRepository());

    await expect(useCase.execute({ videoId: "missing", requesterId: "u1", title: "x" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("throws UnauthorizedError for another user's video", async () => {
    const video = makeVideo({ id: "v1", userId: "owner" });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const useCase = new UpdateVideoTitleUseCase(videoRepository);

    await expect(useCase.execute({ videoId: "v1", requesterId: "stranger", title: "x" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("propagates the DomainError from an overly long title", async () => {
    const video = makeVideo({ id: "v1", userId: "u1" });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const useCase = new UpdateVideoTitleUseCase(videoRepository);

    await expect(useCase.execute({ videoId: "v1", requesterId: "u1", title: "a".repeat(201) })).rejects.toThrow();
    expect(videoRepository.updateTitle).not.toHaveBeenCalled();
  });
});
