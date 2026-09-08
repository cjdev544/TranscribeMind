import { describe, expect, it, vi } from "vitest";
import { DeleteVideoUseCase } from "./delete-video.use-case.js";
import { mockVideoRepository, mockObjectStorage, makeVideo } from "../../../test/mockVideoPorts.js";

describe("DeleteVideoUseCase", () => {
  it("deletes the S3 object and the video row", async () => {
    const video = makeVideo({ id: "v1", userId: "u1", s3Key: "videos/u1/v1.mp4" });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const objectStorage = mockObjectStorage();
    const useCase = new DeleteVideoUseCase(videoRepository, objectStorage);

    await useCase.execute({ videoId: "v1", requesterId: "u1" });

    expect(objectStorage.delete).toHaveBeenCalledWith("videos/u1/v1.mp4");
    expect(videoRepository.delete).toHaveBeenCalledWith("v1");
  });

  it("still deletes the row when the S3 object is already missing", async () => {
    const video = makeVideo({ id: "v1", userId: "u1" });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const objectStorage = mockObjectStorage({ delete: vi.fn().mockRejectedValue(new Error("NoSuchKey")) });
    const useCase = new DeleteVideoUseCase(videoRepository, objectStorage);

    await useCase.execute({ videoId: "v1", requesterId: "u1" });

    expect(videoRepository.delete).toHaveBeenCalledWith("v1");
  });

  it("throws NotFoundError when the video does not exist", async () => {
    const useCase = new DeleteVideoUseCase(mockVideoRepository(), mockObjectStorage());

    await expect(useCase.execute({ videoId: "missing", requesterId: "u1" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws UnauthorizedError for another user's video", async () => {
    const video = makeVideo({ id: "v1", userId: "owner" });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const useCase = new DeleteVideoUseCase(videoRepository, mockObjectStorage());

    await expect(useCase.execute({ videoId: "v1", requesterId: "stranger" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
