import { describe, expect, it, vi } from "vitest";
import { StreamVideoUseCase } from "./stream-video.use-case.js";
import { mockVideoRepository, mockObjectStorage, makeVideo } from "../../../test/mockVideoPorts.js";
import type { DownloadedObject } from "../domain/ports/object-storage.port.js";

describe("StreamVideoUseCase", () => {
  it("downloads the object for the given range", async () => {
    const video = makeVideo({ id: "v1", userId: "u1", s3Key: "videos/u1/v1.mp4" });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const downloaded: DownloadedObject = {
      body: {} as never,
      contentType: "video/mp4",
      contentLength: 100,
      statusCode: 206,
      contentRange: "bytes 0-99/100",
    };
    const objectStorage = mockObjectStorage({ download: vi.fn().mockResolvedValue(downloaded) });
    const useCase = new StreamVideoUseCase(videoRepository, objectStorage);

    const result = await useCase.execute({ videoId: "v1", requesterId: "u1", range: "bytes=0-99" });

    expect(objectStorage.download).toHaveBeenCalledWith({ key: "videos/u1/v1.mp4", range: "bytes=0-99" });
    expect(result).toBe(downloaded);
  });

  it("throws NotFoundError when the video does not exist", async () => {
    const useCase = new StreamVideoUseCase(mockVideoRepository(), mockObjectStorage());

    await expect(useCase.execute({ videoId: "missing", requesterId: "u1" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws UnauthorizedError for another user's video", async () => {
    const video = makeVideo({ id: "v1", userId: "owner" });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const useCase = new StreamVideoUseCase(videoRepository, mockObjectStorage());

    await expect(useCase.execute({ videoId: "v1", requesterId: "stranger" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws a 410 DomainError when the file has already been deleted", async () => {
    const video = makeVideo({ id: "v1", userId: "u1", fileDeletedAt: new Date() });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const useCase = new StreamVideoUseCase(videoRepository, mockObjectStorage());

    await expect(useCase.execute({ videoId: "v1", requesterId: "u1" })).rejects.toMatchObject({ httpStatus: 410 });
  });
});
