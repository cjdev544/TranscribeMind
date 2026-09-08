import { describe, expect, it, vi } from "vitest";
import { CleanupExpiredVideoFilesUseCase } from "./cleanup-expired-video-files.use-case.js";
import { mockVideoRepository, mockObjectStorage, mockLogger, makeVideo } from "../../../test/mockVideoPorts.js";

describe("CleanupExpiredVideoFilesUseCase", () => {
  it("deletes the file for every expired video and reports the count", async () => {
    const expired = [makeVideo({ id: "v1" }), makeVideo({ id: "v2" })];
    const videoRepository = mockVideoRepository({ listCompletedBefore: vi.fn().mockResolvedValue(expired) });
    const objectStorage = mockObjectStorage();
    const useCase = new CleanupExpiredVideoFilesUseCase(videoRepository, objectStorage, mockLogger(), 30);

    const result = await useCase.execute();

    expect(objectStorage.delete).toHaveBeenCalledTimes(2);
    expect(videoRepository.markFileDeleted).toHaveBeenCalledWith("v1");
    expect(videoRepository.markFileDeleted).toHaveBeenCalledWith("v2");
    expect(result).toEqual({ deletedCount: 2 });
  });

  it("queries with a cutoff based on the configured retention days", async () => {
    const videoRepository = mockVideoRepository();
    const useCase = new CleanupExpiredVideoFilesUseCase(videoRepository, mockObjectStorage(), mockLogger(), 30);
    const before = Date.now();

    await useCase.execute();

    const cutoff = vi.mocked(videoRepository.listCompletedBefore).mock.calls[0]![0];
    const expectedCutoff = before - 30 * 24 * 60 * 60 * 1000;
    expect(Math.abs(cutoff.getTime() - expectedCutoff)).toBeLessThan(5000);
  });

  it("continues past a single video's deletion failure and still reports the successful ones", async () => {
    const expired = [makeVideo({ id: "v1" }), makeVideo({ id: "v2" })];
    const videoRepository = mockVideoRepository({ listCompletedBefore: vi.fn().mockResolvedValue(expired) });
    const objectStorage = mockObjectStorage({
      delete: vi.fn().mockRejectedValueOnce(new Error("S3 down")).mockResolvedValueOnce(undefined),
    });
    const useCase = new CleanupExpiredVideoFilesUseCase(videoRepository, objectStorage, mockLogger(), 30);

    const result = await useCase.execute();

    expect(result).toEqual({ deletedCount: 1 });
    expect(videoRepository.markFileDeleted).toHaveBeenCalledTimes(1);
  });

  it("returns deletedCount 0 with nothing expired", async () => {
    const useCase = new CleanupExpiredVideoFilesUseCase(mockVideoRepository(), mockObjectStorage(), mockLogger(), 30);

    const result = await useCase.execute();

    expect(result).toEqual({ deletedCount: 0 });
  });
});
