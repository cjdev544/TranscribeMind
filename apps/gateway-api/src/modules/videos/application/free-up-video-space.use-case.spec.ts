import { describe, expect, it, vi } from "vitest";
import { VideoStatus } from "@transcribemind/contracts";
import { FreeUpVideoSpaceUseCase } from "./free-up-video-space.use-case.js";
import { mockVideoRepository, mockObjectStorage, makeVideo } from "../../../test/mockVideoPorts.js";

describe("FreeUpVideoSpaceUseCase", () => {
  it("deletes the S3 object and marks the file deleted", async () => {
    const video = makeVideo({ id: "v1", userId: "u1", status: VideoStatus.COMPLETED, s3Key: "videos/u1/v1.mp4" });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const objectStorage = mockObjectStorage();
    const useCase = new FreeUpVideoSpaceUseCase(videoRepository, objectStorage);

    await useCase.execute({ videoId: "v1", requesterId: "u1" });

    expect(objectStorage.delete).toHaveBeenCalledWith("videos/u1/v1.mp4");
    expect(videoRepository.markFileDeleted).toHaveBeenCalledWith("v1");
  });

  it("is a no-op when the file was already deleted", async () => {
    const video = makeVideo({ id: "v1", userId: "u1", status: VideoStatus.COMPLETED, fileDeletedAt: new Date() });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const objectStorage = mockObjectStorage();
    const useCase = new FreeUpVideoSpaceUseCase(videoRepository, objectStorage);

    await useCase.execute({ videoId: "v1", requesterId: "u1" });

    expect(objectStorage.delete).not.toHaveBeenCalled();
    expect(videoRepository.markFileDeleted).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when the video does not exist", async () => {
    const useCase = new FreeUpVideoSpaceUseCase(mockVideoRepository(), mockObjectStorage());

    await expect(useCase.execute({ videoId: "missing", requesterId: "u1" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws UnauthorizedError for another user's video", async () => {
    const video = makeVideo({ id: "v1", userId: "owner", status: VideoStatus.COMPLETED });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const useCase = new FreeUpVideoSpaceUseCase(videoRepository, mockObjectStorage());

    await expect(useCase.execute({ videoId: "v1", requesterId: "stranger" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects freeing space on a video that has not finished processing", async () => {
    const video = makeVideo({ id: "v1", userId: "u1", status: VideoStatus.TRANSCRIBING });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const useCase = new FreeUpVideoSpaceUseCase(videoRepository, mockObjectStorage());

    await expect(useCase.execute({ videoId: "v1", requesterId: "u1" })).rejects.toThrow(
      "Solo se puede liberar espacio de videos ya procesados"
    );
  });
});
